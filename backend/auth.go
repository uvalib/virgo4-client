package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/xid"
	"github.com/uvalib/virgo4-jwt/v4jwt"
	"gorm.io/gorm"
)

// Authorize is the API for minting JWT for accessing the API as a guest
func (svc *ServiceContext) Authorize(c *gin.Context) {
	log.Printf("Generate API access token")
	guestClaim := v4jwt.V4Claims{Role: v4jwt.Guest}
	signedStr, err := v4jwt.Mint(guestClaim, 30*time.Minute, svc.JWTKey)
	if err != nil {
		log.Printf("ERROR: Unable to generate signed JWT token: %s", err.Error())
		c.String(http.StatusInternalServerError, "unable to generate authorization")
		return
	}

	c.String(http.StatusOK, signedStr)
}

// NetbadgeAuthentication checks headers for NetBadge authentication
// information. Upon success or failure redirect to the appropriate location.
// NOTE: this is called directly from the front-end as a transient page with
// window.location.href = "/authenticate/netbadge" to force it through
// NetBadge authentication.
func (svc *ServiceContext) NetbadgeAuthentication(c *gin.Context) {
	log.Printf("Checking authentication headers...")
	log.Printf("Dump all request headers ==================================")
	for name, values := range c.Request.Header {
		for _, value := range values {
			log.Printf("%s=%s\n", name, value)
		}
	}
	log.Printf("END header dump ===========================================")

	computingID := c.GetHeader("remote_user")
	if svc.Dev.AuthUser != "" {
		computingID = svc.Dev.AuthUser
		log.Printf("Using dev auth user ID: %s", computingID)
	}
	if computingID == "" {
		log.Printf("ERROR: Expected auth header not present in request. Not authorized.")
		c.Redirect(http.StatusFound, "/forbidden")
		return
	}
	membershipStr := c.GetHeader("member")
	if svc.Dev.Role != "" {
		membershipStr = "cn=" + svc.Dev.Role
		log.Printf("Using dev role: %s", membershipStr)
	}
	role := parseMembership(membershipStr)
	log.Printf("NetBadge headers are valid. Get user %s:%s", computingID, role)
	v4User, uErr := svc.getOrCreateUser(computingID)
	if uErr != nil {
		log.Printf("ERROR: unable to get or create user %s - %s: %s", computingID, role, uErr.Error())
		c.Redirect(http.StatusFound, "/forbidden")
		return
	}

	log.Printf("Generate JWT for %s", computingID)
	signedStr, jwtErr := svc.generateJWT(c, v4User, v4jwt.Netbadge, role)
	if jwtErr != nil {
		c.Redirect(http.StatusFound, "/forbidden")
		return
	}

	// Set auth info in a cookie the client can read and pass along in future requests
	c.SetCookie("v4_jwt", signedStr, 10, "/", "", false, false)
	c.SetSameSite(http.SameSiteLaxMode)
	if c.Request.Header.Get("Content-Type") == "application/json" {
		c.String(http.StatusOK, signedStr)
	} else {
		c.Redirect(http.StatusFound, "/signedin")
	}
}

// PublicAuthentication aill authenticate public users of Virgo4
func (svc *ServiceContext) PublicAuthentication(c *gin.Context) {
	log.Printf("Public signin request; checking parameters")
	var auth struct {
		Barcode  string `json:"barcode"`
		Password string `json:"password"`
	}
	var resp struct {
		Barcode      string `json:"barcode"`
		SignedIn     bool   `json:"signedIn"`
		LockedOut    bool   `json:"lockedOut"`
		Message      string `json:"message"`
		AttemptsLeft int    `json:"attemptsLeft"`
	}
	resp.AttemptsLeft = 10
	if err := c.BindJSON(&auth); err != nil {
		log.Printf("Unable to parse params: %s", err.Error())
		resp.Message = "Invalid request"
		c.JSON(http.StatusBadRequest, resp)
		return
	}

	log.Printf("Lookup user barcode %s...", auth.Barcode)
	resp.Barcode = auth.Barcode
	v4User, uErr := svc.getOrCreateUser(auth.Barcode)
	if uErr != nil {
		log.Printf("ERROR: unable to find user %s: %s", auth.Barcode, uErr.Error())
		c.JSON(http.StatusForbidden, resp)
		return
	}

	if v4User.LockedOut {
		now := time.Now()
		if now.After(*v4User.LockedOutUntil) {
			log.Printf("User %s lockout has expired", auth.Barcode)
			v4User.LockedOut = false
			v4User.LockedOutUntil = nil
			svc.GDB.Model(&v4User).Select("LockedOut", "LockedOutUntil").Updates(v4User)
		} else {
			log.Printf("User %s is currently locked out of their account", auth.Barcode)
			delta := v4User.LockedOutUntil.Sub(now)
			resp.AttemptsLeft = 0
			resp.LockedOut = true
			resp.Message = fmt.Sprintf("Your account is locked for %d minutes", int(delta.Minutes()))
			c.JSON(http.StatusForbidden, resp)
			return
		}
	}

	log.Printf("Track auth attempt for user %s...", auth.Barcode)
	now := time.Now()
	if v4User.AuthStartedAt == nil {
		v4User.AuthStartedAt = &now
		v4User.AuthTries = 1
	} else {
		// If this attempt is within 1 minute of the start, increment attempt
		// counter. If not, start a new auth tracking session
		delta := now.Sub(*v4User.AuthStartedAt)
		if delta.Minutes() > 1.0 {
			log.Printf("First auth attempt for %s", auth.Barcode)
			v4User.AuthStartedAt = &now
			v4User.AuthTries = 1
		} else {
			log.Printf("Last auth attempt for %s was %1.2f seconds ago", auth.Barcode, delta.Seconds())
			v4User.AuthTries++
		}
	}
	resp.AttemptsLeft = 10 - v4User.AuthTries
	svc.GDB.Model(&v4User).Select("AuthStartedAt", "AuthTries", "AttemptsLeft").Updates(v4User)

	log.Printf("Validate user barcode %s with ILS Connector...", auth.Barcode)
	authURL := fmt.Sprintf("%s/users/check_password", svc.ILSAPI)
	bodyBytes, ilsErr := svc.ILSConnectorPost(authURL, auth, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil && ilsErr.StatusCode == 503 {
		c.String(503, "Password sign in is temporarily unavailable. Please try again later.")
		return
	}

	if string(bodyBytes) != "valid" {
		// The in verification failed. If this has happened 10 times in a
		// minute, lock out the account for one hour
		log.Printf("ERROR: password for %s failed authentication", auth.Barcode)
		if v4User.AuthTries >= 10 {
			log.Printf("User %s account is now locked out for 1 hour", v4User.Virgo4ID)
			resp.Message = "Authentication failed. Your account is now locked for one hour."
			resp.LockedOut = true
			now := time.Now()
			later := now.Add(time.Hour)
			v4User.LockedOut = true
			v4User.LockedOutUntil = &later
			svc.GDB.Model(&v4User).Select("LockedOut", "LockedOutUntil").Updates(v4User)
		} else {
			resp.Message = "Authentication failed"
		}
		c.JSON(http.StatusForbidden, resp)
		return
	}

	log.Printf("%s passed password check", auth.Barcode)
	resp.SignedIn = true

	log.Printf("Generate JWT for %s", auth.Barcode)
	signedStr, jwtErr := svc.generateJWT(c, v4User, v4jwt.PIN, v4jwt.User)
	if jwtErr != nil {
		resp.Message = jwtErr.Error()
		c.JSON(http.StatusForbidden, resp)
		return
	}

	// Set auth info in a cookie the client can read and pass along in future requests
	c.SetCookie("v4_jwt", signedStr, 10, "/", "", false, false)
	c.SetSameSite(http.SameSiteLaxMode)
	c.JSON(http.StatusOK, resp)
}

// RefreshAuthentication will use the long-lived refresh token for a user to generate a short-lived
// auth token, then regenerate the lon-lived token
func (svc *ServiceContext) RefreshAuthentication(c *gin.Context) {
	tokenStr, err := getBearerToken(c.Request.Header.Get("Authorization"))
	if err != nil {
		log.Printf("ERROR: Authentication failed, no JWT in header: [%s]", err.Error())
		c.String(http.StatusUnauthorized, "unauthorized request")
		return
	}

	refreshToken, err := c.Cookie("v4_refresh")
	if err != nil {
		log.Printf("Authentication failed, refresh token for %s expired or not accessible %s", tokenStr, err.Error())
		c.String(http.StatusUnauthorized, "unauthorized request")
		return
	}

	refreshed, err := v4jwt.Refresh(tokenStr, 30*time.Minute, svc.JWTKey)
	if err != nil {
		log.Printf("ERROR: Unable to refresh JWT %s: %s", tokenStr, err.Error())
		c.String(http.StatusUnauthorized, "unauthorized request")
		return
	}
	v4Claims, jwtErr := v4jwt.Validate(refreshed, svc.JWTKey)
	if jwtErr != nil {
		if errors.Is(err, &v4jwt.VersionError{}) {
			log.Printf("ERROR: refresehed jwt has bad version: %s", jwtErr.Error())
			c.AbortWithStatus(http.StatusNotAcceptable)
		} else {
			log.Printf("ERROR: signature for refreshed jwt is invalid: %s", jwtErr.Error())
			c.AbortWithStatus(http.StatusUnauthorized)
		}
		return
	}

	log.Printf("Regenerate long-lived refresh token for %s", v4Claims.UserID)
	refreshToken = xid.New().String()
	c.SetCookie("v4_refresh", refreshToken, 60*60*24*7, "/", "", false, true)

	c.String(http.StatusOK, refreshed)
}

// SignOut ends a user session and removes the refresh token
func (svc *ServiceContext) SignOut(c *gin.Context) {
	c.SetCookie("v4_refresh", "invalid", -1, "/", "", false, true)
	c.SetCookie("v4_jwt", "invalid", -1, "/", "", false, false)
}

// SetAdminClaims sets claims and regenerates the auth token
func (svc *ServiceContext) SetAdminClaims(c *gin.Context) {
	//Dev server only
	v4HostHeader := c.Request.Header.Get("V4Host")
	log.Printf("INFO: update claims host header [%s], dev user [%s]", v4HostHeader, svc.Dev.AuthUser)
	if !strings.Contains(v4HostHeader, "-dev") && svc.Dev.AuthUser == "" {
		log.Printf("ERROR: Setting admin claim is dev only.")
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	// Admin only
	claimsIface, _ := c.Get("claims")
	originalClaims, ok := claimsIface.(*v4jwt.V4Claims)
	if !ok || (originalClaims.Role != v4jwt.Admin) {
		log.Printf("ERROR: User not an admin: %s", originalClaims.UserID)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	var claims map[string]interface{}
	// Take the claims received as-is. Expecting admins to not screw this up.
	if err := c.BindJSON(&claims); err != nil {
		log.Printf("Unable to parse claims: %s", err.Error())
		c.JSON(http.StatusBadRequest, "Invalid Claims")
		return
	}

	claims["role"] = v4jwt.RoleFromString(claims["role"].(string))
	claims["authMethod"] = v4jwt.AuthFromString(claims["authMethod"].(string))

	claimBytes, err := json.Marshal(claims)
	v4Claims := v4jwt.V4Claims{}

	err = json.Unmarshal(claimBytes, &v4Claims)

	signedStr, err := v4jwt.Mint(v4Claims, 30*time.Minute, svc.JWTKey)
	if err != nil {
		log.Printf("Unable to generate signed JWT token: %s", err.Error())
		c.JSON(http.StatusBadRequest, "Invalid Claims")
		return
	}

	c.SetCookie("v4_jwt", signedStr, 10, "/", "", false, false)
	c.SetSameSite(http.SameSiteLaxMode)
	c.String(http.StatusOK, "Success")
}

// getOrCreateUser finds an existing user. If a user is not found, one is created
func (svc *ServiceContext) getOrCreateUser(userID string) (*User, error) {
	var user User
	err := svc.GDB.Where("virgo4_id = ?", userID).First(&user)
	if err.Error != nil {
		if errors.Is(err.Error, gorm.ErrRecordNotFound) == false {
			return nil, err.Error
		}
		log.Printf("User %s does not exist, creating and setting auth token", userID)
		user := User{ID: 0, Virgo4ID: userID, Preferences: "{}"}
		addErr := svc.GDB.Omit("Bookmarks").Create(&user)
		if addErr.Error != nil {
			return nil, addErr.Error
		}
		return &user, nil
	}

	log.Printf("User found; details: %+v", user)
	return &user, nil
}

func (svc *ServiceContext) generateJWT(c *gin.Context, v4User *User, authMethod v4jwt.AuthEnum, role v4jwt.RoleEnum) (string, error) {
	v4Claims := v4jwt.V4Claims{
		UserID:     v4User.Virgo4ID,
		AuthMethod: authMethod,
		IsUVA:      false,
		Role:       role,
	}

	guestClaim := v4jwt.V4Claims{Role: v4jwt.Guest}
	guestJWT, _ := v4jwt.Mint(guestClaim, 1*time.Minute, svc.JWTKey)

	log.Printf("Get ILS Connector data for user %s", v4User.Virgo4ID)
	userURL := fmt.Sprintf("%s/users/%s", svc.ILSAPI, v4User.Virgo4ID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL, guestJWT, svc.HTTPClient)
	if ilsErr != nil {
		return "", errors.New(ilsErr.Message)
	}

	var ilsUser ILSUserInfo
	if err := json.Unmarshal(bodyBytes, &ilsUser); err != nil {
		log.Printf("ERROR: unable to parse ILS user response: %s", err.Error())
		return "", err
	}

	log.Printf("Adding %s claims based on ILS response", v4User.Virgo4ID)

	v4Claims.IsUVA = !ilsUser.CommunityUser
	if ilsUser.NoAccount {
		log.Printf("WARN: User %s has no Sirsi account", v4User.Virgo4ID)
		v4Claims.CanLEO = false
		v4Claims.CanLEOPlus = false
		v4Claims.CanPurchase = false
		v4Claims.CanPlaceReserve = false
		v4Claims.UseSIS = false
		v4Claims.Role = v4jwt.Guest
	} else {
		v4Claims.Barcode = ilsUser.Barcode
		v4Claims.HomeLibrary = ilsUser.HomeLibrary
		v4Claims.Profile = ilsUser.Profile
		v4Claims.CanLEO = (ilsUser.HomeLibrary != "UVA-LIB")
		v4Claims.CanLEOPlus = false // TODO update with rules once they have been decided
		v4Claims.CanPurchase = ilsUser.CanPurchase()
		v4Claims.CanPlaceReserve = ilsUser.CanPlaceReserve()
		v4Claims.UseSIS = (ilsUser.IsUndergraduate() || ilsUser.IsGraduate() || ilsUser.IsAlumni())
	}

	// ILLiad Claims
	v4Claims.HasIlliad = false
	respBytes, illErr := svc.ILLiadRequest("GET", fmt.Sprintf("Users/%s", v4Claims.UserID), nil)
	if illErr != nil && illErr.StatusCode == 404 {
		log.Printf("WARN: unable to get ILLiad user: %s", illErr.Message)
	} else if illErr != nil {
		log.Printf("ERROR: unable to get ILLiad user: %s", illErr.Message)
	} else {
		v4Claims.HasIlliad = true
		type illiadResponse struct {
			Department   string `json:"Department"`
			Organization string `json:"Organization"`
			Country      string `json:"Country"`
			Cleared      string `json:"Cleared"`
		}
		var illResp illiadResponse
		var locationParts []string
		if err := json.Unmarshal(respBytes, &illResp); err != nil {
			log.Printf("ERROR: unable to parse ILLiad user response: %s\n%s", err.Error(), respBytes)
		} else {
			if illResp.Department != "" {
				locationParts = append(locationParts, illResp.Department)
			}
			if illResp.Organization != "" {
				locationParts = append(locationParts, illResp.Organization)
			}
			if illResp.Country != "" {
				locationParts = append(locationParts, illResp.Country)
			}

			v4Claims.LEOLocation = strings.Join(locationParts, ", ")
			v4Claims.IlliadCleared = illResp.Cleared
		}
	}

	log.Printf("User %s claims %+v", v4User.Virgo4ID, v4Claims)

	signedStr, err := v4jwt.Mint(v4Claims, 30*time.Minute, svc.JWTKey)
	if err != nil {
		log.Printf("Unable to generate signed JWT token: %s", err.Error())
		return "", err
	}

	log.Printf("Create long-lived refresh token for %s", v4User.Virgo4ID)
	refreshToken := xid.New().String()
	c.SetCookie("v4_refresh", refreshToken, 60*60*24*7, "/", "", false, true)

	return signedStr, nil
}

// parseMembership will parse V4 role from the mygroups membership string.
// Membership format: cn=group_name1;cn=group_name2;...
func parseMembership(membershipStr string) v4jwt.RoleEnum {
	out := v4jwt.User
	log.Printf("INFO: memberships [%s]", membershipStr)
	// for now, only admins are suported. They are identified by lib-virgo4-admin
	if strings.Contains(membershipStr, "lib-virgo4-admin") {
		// NOTE: a user can be members of both admin, pda and staff.
		//       precedence admin > pda > staff > user > guest
		out = v4jwt.Admin
		log.Printf("INFO: this is an admin user")
	} else if strings.Contains(membershipStr, "lib-virgo4-pda") {
		out = v4jwt.PDAAdmin
		log.Printf("INFO: this is a PDA admin user: %s", out.String())
	} else if strings.Contains(membershipStr, "lib-virgo4-staff") || strings.Contains(membershipStr, "lb-scpres-joint") {
		out = v4jwt.Staff
		log.Printf("INFO: this is virgo staff: %s", out.String())
	}
	return out
}

// getJWTClaims will pull JWT claims out of the gin context
func getJWTClaims(c *gin.Context) (*v4jwt.V4Claims, error) {
	claims, signedIn := c.Get("claims")
	if signedIn == false {
		return nil, errors.New("No JWT claims found")
	}
	v4Claims, ok := claims.(*v4jwt.V4Claims)
	if !ok {
		return nil, errors.New("Invalid JWT claims found")
	}
	return v4Claims, nil
}
