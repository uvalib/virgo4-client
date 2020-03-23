package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
)

// V4Claims encapsulates all of the information about an anonymous or
// signed in Virgo4 user
type V4Claims struct {
	UserID           string `json:"userId"` // v4 userID or anonymous
	IsUVA            bool   `json:"isUva"`
	CanPurchase      bool   `json:"canPurchase"`
	CanLEO           bool   `json:"canLEO"`
	CanLEOPlus       bool   `json:"canLEOPlus"`
	CanPlaceReserve  bool   `json:"canPlaceReserve"`
	CanBrowseReserve bool   `json:"canBrowseReserve"`
	Role             string `json:"role"`       // user, admin or guest
	AuthMethod       string `json:"authMethod"` // none, pin, netbadge
	jwt.StandardClaims
}

// Authorize is the API for minting JWT for accessing the API as a guest
func (svc *ServiceContext) Authorize(c *gin.Context) {
	log.Printf("Generate API access token")
	expirationTime := time.Now().Add(24 * time.Hour)
	v4Claims := V4Claims{
		UserID:     "anonymous",
		AuthMethod: "none",
		Role:       "guest",
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
			Issuer:    "v4",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, v4Claims)
	signedStr, err := token.SignedString(svc.JWTKey)
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
	v4User, uErr := svc.getUpdatedUser(computingID, role)
	if uErr != nil {
		log.Printf("ERROR: unable to get or create user %s - %s: %s", computingID, role, uErr.Error())
		c.Redirect(http.StatusFound, "/forbidden")
		return
	}

	log.Printf("Generate JWT for %s", computingID)
	signedStr, jwtErr := svc.generateJWT(v4User, "netbadge")
	if jwtErr != nil {
		c.Redirect(http.StatusFound, "/forbidden")
		return
	}

	// Set auth info in a cookie the client can read and pass along in future requests
	c.SetCookie("v4_jwt", signedStr, 3600*24, "/", "", false, false)
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
	v4User, uErr := svc.getUpdatedUser(auth.Barcode, "user")
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
	bodyBytes, _ := svc.ILSConnectorGet(authURL)

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
	signedStr, jwtErr := svc.generateJWT(v4User, "pin")
	if jwtErr != nil {
		resp.Message = jwtErr.Error()
		c.JSON(http.StatusForbidden, resp)
		return
	}

	// Set auth info in a cookie the client can read and pass along in future requests
	c.SetCookie("v4_jwt", signedStr, 3600*24, "/", "", false, false)
	c.JSON(http.StatusOK, resp)
}

// getUpdatedUser finds an existing user and updates role if necessary.
// If a user is not found, one is created
func (svc *ServiceContext) getUpdatedUser(userID string, role string) (*V4User, error) {
	var user V4User
	q := svc.DB.NewQuery(`select * from users where virgo4_id={:id}`)
	q.Bind(dbx.Params{"id": userID})
	err := q.One(&user)
	if err != nil {
		log.Printf("User %s does not exist, creating and setting auth token", userID)
		user := V4User{ID: 0, Virgo4ID: userID, Role: role, Preferences: "{}"}
		addErr := svc.DB.Model(&user).Exclude("BookMarkFolders").Insert()
		if addErr != nil {
			log.Printf("Unable to create user %s: %s", userID, addErr.Error())
			return nil, addErr
		}
		return &user, nil
	}

	log.Printf("User found; details: %+v", user)
	if user.Role != role {
		user.Role = role
		err := svc.DB.Model(&user).Exclude("BookMarkFolders").Update()
		if err != nil {
			log.Printf("WARN: not able to update user %s role from %s to %s: %s",
				userID, user.Role, role, err.Error())
		}
	}

	return &user, nil
}

// SignoutUser ends the auth session for the target user. All session tracking
// data should be cleaned up
func (svc *ServiceContext) SignoutUser(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Sign out user %s", userID)
	c.SetCookie("v4_jwt", "invalid", -1, "/", "", false, false)
	c.String(http.StatusOK, "signedout")
}

// AuthMiddleware is middleware that checks for a user auth token in the
// Authorization header. For now, it does nothing but ensure token presence.
func (svc *ServiceContext) AuthMiddleware(c *gin.Context) {
	tokenStr, err := getBearerToken(c.Request.Header.Get("Authorization"))
	if err != nil {
		log.Printf("Authentication failed: [%s]", err.Error())
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	if tokenStr == "undefined" {
		log.Printf("Authentication failed; bearer token is undefined")
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	log.Printf("Validating JWT auth token...")
	v4Claimss := &V4Claims{}
	tkn, jwtErr := jwt.ParseWithClaims(tokenStr, v4Claimss, func(token *jwt.Token) (interface{}, error) {
		return svc.JWTKey, nil
	})

	if jwtErr != nil {
		log.Printf("JWT signature for %s is invalid: %s", tokenStr, err.Error())
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	log.Printf("TOKEN %+v", tkn)

	// add the V4 JWT claims to the request context so other handlers can access it.
	c.Set("token", v4Claimss)
	log.Printf("got bearer token: [%s]: %+v", tokenStr, v4Claimss)
}

func (svc *ServiceContext) generateJWT(v4User *V4User, authMethod string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	v4Claims := V4Claims{
		UserID:     v4User.Virgo4ID,
		AuthMethod: authMethod,
		IsUVA:      true,
		Role:       v4User.Role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
			Issuer:    "v4",
		},
	}

	log.Printf("Get ILS Connector data for user %s", v4User.Virgo4ID)
	userURL := fmt.Sprintf("%s/v4/users/%s", svc.ILSAPI, v4User.Virgo4ID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL)
	if ilsErr != nil {
		return "", errors.New(ilsErr.Message)
	}

	var ilsUser ILSUserInfo
	if err := json.Unmarshal(bodyBytes, &ilsUser); err != nil {
		log.Printf("ERROR: unable to parse ILS user response: %s", err.Error())
		return "", err
	}

	log.Printf("Adding %s claims based on ILS response", v4User.Virgo4ID)
	v4Claims.CanLEO = (ilsUser.HomeLibrary == "LEO")
	v4Claims.CanLEOPlus = false // TODO update with rules once they have been decided
	v4Claims.CanPurchase = ilsUser.CanPurchase()
	v4Claims.CanBrowseReserve = (ilsUser.CommunityUser == false)
	v4Claims.CanPlaceReserve = ilsUser.CanPlaceReserve()
	log.Printf("User %s claims %+v", v4User.Virgo4ID, v4Claims)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, v4Claims)
	signedStr, err := token.SignedString(svc.JWTKey)
	if err != nil {
		log.Printf("Unable to generate signed JWT token: %s", err.Error())
		return "", err
	}

	return signedStr, nil
}

// parseMembership will parse V4 role from the mygroups membership string.
// Membership format: cn=group_name1;cn=group_name2;...
func parseMembership(membershipStr string) string {
	out := "user"
	// for now, only admins are suported. They are identified by lib-virgo4-admin
	if strings.Contains(membershipStr, "lib-virgo4-admin") {
		out = "admin"
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
