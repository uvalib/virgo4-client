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
	dbx "github.com/go-ozzo/ozzo-dbx"
	"github.com/uvalib/virgo4-jwt/v4jwt"
)

// Authorize is the API for minting JWT for accessing the API as a guest
func (svc *ServiceContext) Authorize(c *gin.Context) {
	log.Printf("Generate API access token")
	guestClaim := v4jwt.V4Claims{Role: v4jwt.Guest}
	signedStr, err := v4jwt.Mint(guestClaim, 9*time.Hour, svc.JWTKey)
	if err != nil {
		log.Printf("Unable to generate signed JWT token: %s", err.Error())
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
	signedStr, jwtErr := svc.generateJWT(v4User, v4jwt.Netbadge, role)
	if jwtErr != nil {
		c.Redirect(http.StatusFound, "/forbidden")
		return
	}

	// Set auth info in a cookie the client can read and pass along in future requests
	c.SetCookie("v4_jwt", signedStr, 3600*9, "/", "", false, false)
	c.SetSameSite(http.SameSiteLaxMode)
	c.Redirect(http.StatusFound, "/signedin")
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
	resp.AttemptsLeft = 5
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
			svc.DB.Model(&v4User).Exclude("BookMarkFolders").Update()
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
	resp.AttemptsLeft = 5 - v4User.AuthTries
	svc.DB.Model(&v4User).Exclude("BookMarkFolders").Update()

	log.Printf("Validate user barcode %s with ILS Connector...", auth.Barcode)
	authURL := fmt.Sprintf("%s/v4/users/%s/check_pin?pin=%s", svc.ILSAPI, auth.Barcode, auth.Password)
	bodyBytes, _ := svc.ILSConnectorGet(authURL, c.GetString("jwt"))

	if string(bodyBytes) != "valid" {
		// The in verification failed. If this has happened 5 times in a
		// minute, lock out the account for one hour
		log.Printf("ERROR: pin for %s falied authentication", auth.Barcode)
		if v4User.AuthTries >= 5 {
			log.Printf("User %s account is now locked out for 1 hour", v4User.Virgo4ID)
			resp.Message = "Authentication failed. Your account is now locked for one hour."
			resp.LockedOut = true
			now := time.Now()
			later := now.Add(time.Hour)
			v4User.LockedOut = true
			v4User.LockedOutUntil = &later
			svc.DB.Model(&v4User).Exclude("BookMarkFolders").Update()
		} else {
			resp.Message = "Authentication failed"
		}
		c.JSON(http.StatusForbidden, resp)
		return
	}

	log.Printf("%s passed pin check", auth.Barcode)
	resp.SignedIn = true

	log.Printf("Generate JWT for %s", auth.Barcode)
	signedStr, jwtErr := svc.generateJWT(v4User, v4jwt.PIN, v4jwt.User)
	if jwtErr != nil {
		resp.Message = jwtErr.Error()
		c.JSON(http.StatusForbidden, resp)
		return
	}

	// Set auth info in a cookie the client can read and pass along in future requests
	c.SetCookie("v4_jwt", signedStr, 3600*9, "/", "", false, false)
	c.SetSameSite(http.SameSiteLaxMode)
	c.JSON(http.StatusOK, resp)
}

// SetAdminClaims sets claims and regenerates the auth token
func (svc *ServiceContext) SetAdminClaims(c *gin.Context) {
	//Dev server only
	v4HostHeader := c.Request.Header.Get("V4Host")
	if strings.Index(v4HostHeader, "-dev") == 0 && svc.Dev.AuthUser == "" {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	// Admin only
	claimsIface, _ := c.Get("claims")
	originalClaims, ok := claimsIface.(*v4jwt.V4Claims)
	if !ok || (originalClaims.Role != v4jwt.Admin) {
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

	signedStr, err := v4jwt.Mint(v4Claims, 9*time.Hour, svc.JWTKey)
	if err != nil {
		log.Printf("Unable to generate signed JWT token: %s", err.Error())
		c.JSON(http.StatusBadRequest, "Invalid Claims")
		return
	}

	c.SetCookie("v4_jwt", signedStr, 3600*9, "/", "", false, false)
	c.SetSameSite(http.SameSiteLaxMode)
	c.String(http.StatusOK, "Success")
}

// getOrCreateUser finds an existing user. If a user is not found, one is created
func (svc *ServiceContext) getOrCreateUser(userID string) (*V4User, error) {
	var user V4User
	q := svc.DB.NewQuery(`select * from users where virgo4_id={:id}`)
	q.Bind(dbx.Params{"id": userID})
	err := q.One(&user)
	if err != nil {
		log.Printf("User %s does not exist, creating and setting auth token", userID)
		user := V4User{ID: 0, Virgo4ID: userID, Preferences: "{}"}
		addErr := svc.DB.Model(&user).Exclude("BookMarkFolders").Insert()
		if addErr != nil {
			log.Printf("Unable to create user %s: %s", userID, addErr.Error())
			return nil, addErr
		}
		return &user, nil
	}

	log.Printf("User found; details: %+v", user)
	return &user, nil
}

// AuthMiddleware is middleware that checks for a user auth token in the
// Authorization header. For now, it does nothing but ensure token presence.
func (svc *ServiceContext) AuthMiddleware(c *gin.Context) {
	tokenStr, err := getBearerToken(c.Request.Header.Get("Authorization"))
	if err != nil {
		log.Printf("Authentication failed: [%s]", err.Error())
		c.SetCookie("v4_jwt", "invalid", -1, "/", "", false, false)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	if tokenStr == "undefined" {
		log.Printf("Authentication failed; bearer token is undefined")
		c.SetCookie("v4_jwt", "invalid", -1, "/", "", false, false)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	log.Printf("Validating JWT auth token...")
	v4Claims, jwtErr := v4jwt.Validate(tokenStr, svc.JWTKey)
	if jwtErr != nil {
		log.Printf("JWT signature for %s is invalid: %s", tokenStr, jwtErr.Error())
		c.SetCookie("v4_jwt", "invalid", -1, "/", "", false, false)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	// add the parsed claims and signed JWT string to the request context so other handlers can access it.
	c.Set("jwt", tokenStr)
	c.Set("claims", v4Claims)
	log.Printf("got bearer token: [%s]: %+v", tokenStr, v4Claims)
}

func (svc *ServiceContext) generateJWT(v4User *V4User, authMethod v4jwt.AuthEnum, role v4jwt.RoleEnum) (string, error) {
	v4Claims := v4jwt.V4Claims{
		UserID:     v4User.Virgo4ID,
		AuthMethod: authMethod,
		IsUVA:      true,
		Role:       role,
	}

	guestClaim := v4jwt.V4Claims{Role: v4jwt.Guest}
	guestJWT, _ := v4jwt.Mint(guestClaim, 9*time.Hour, svc.JWTKey)

	log.Printf("Get ILS Connector data for user %s", v4User.Virgo4ID)
	userURL := fmt.Sprintf("%s/v4/users/%s", svc.ILSAPI, v4User.Virgo4ID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL, guestJWT)
	if ilsErr != nil {
		return "", errors.New(ilsErr.Message)
	}

	var ilsUser ILSUserInfo
	if err := json.Unmarshal(bodyBytes, &ilsUser); err != nil {
		log.Printf("ERROR: unable to parse ILS user response: %s", err.Error())
		return "", err
	}

	log.Printf("Adding %s claims based on ILS response", v4User.Virgo4ID)
	// Normally this is HomeLibrary == "LEO"
	v4Claims.CanLEO = (ilsUser.HomeLibrary != "UVA-LIB")
	v4Claims.CanLEOPlus = false // TODO update with rules once they have been decided
	v4Claims.CanPurchase = ilsUser.CanPurchase()
	v4Claims.CanPlaceReserve = ilsUser.CanPlaceReserve()
	v4Claims.UseSIS = (ilsUser.IsUndergraduate() || ilsUser.IsGraduate() || ilsUser.IsAlumni())
	log.Printf("User %s claims %+v", v4User.Virgo4ID, v4Claims)

	signedStr, err := v4jwt.Mint(v4Claims, 9*time.Hour, svc.JWTKey)
	if err != nil {
		log.Printf("Unable to generate signed JWT token: %s", err.Error())
		return "", err
	}

	return signedStr, nil
}

// parseMembership will parse V4 role from the mygroups membership string.
// Membership format: cn=group_name1;cn=group_name2;...
func parseMembership(membershipStr string) v4jwt.RoleEnum {
	out := v4jwt.User
	// for now, only admins are suported. They are identified by lib-virgo4-admin
	if strings.Contains(membershipStr, "lib-virgo4-admin") {
		out = v4jwt.Admin
	}
	return out
}

// getBearerToken is a helper to extract the token from headers
func getBearerToken(authorization string) (string, error) {
	components := strings.Split(strings.Join(strings.Fields(authorization), " "), " ")

	// must have two components, the first of which is "Bearer", and the second a non-empty token
	if len(components) != 2 || components[0] != "Bearer" || components[1] == "" {
		return "", fmt.Errorf("Invalid Authorization header: [%s]", authorization)
	}

	return components[1], nil
}
