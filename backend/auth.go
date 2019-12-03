package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
	"github.com/rs/xid"
)

// Authorize is the API for minting API access tokens.
func (svc *ServiceContext) Authorize(c *gin.Context) {
	log.Printf("Generate API access token")
	token := xid.New().String()
	c.String(http.StatusOK, token)
}

// NetbadgeAuthentication checks headers for NetBadge authentication
// information. Upon success or failure redirect to the appropriate location.
// NOTE: this is called directly from the front-end as a transient page with
// window.location.href = "/authenticate/netbadge" to force it through
// NetBadge authentication.
func (svc *ServiceContext) NetbadgeAuthentication(c *gin.Context) {
	log.Printf("Checking authentication headers...")
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
	log.Printf("NetBadge headers are valid. Generate new auth token for %s", computingID)

	// Generate a new access token and persist it in v4 user storage
	authToken := xid.New().String()
	err := svc.updateAccessToken(computingID, authToken)
	if err != nil {
		log.Printf("WARN: Unable to persist user %s access token %v", computingID, err)
	}

	// Set auth info in a cookie the client can read and pass along in future requests
	authStr := fmt.Sprintf("%s|%s|netbadge", computingID, authToken)
	log.Printf("AuthSession %s", authStr)
	c.SetCookie("v4_auth_user", authStr, 3600*24, "/", "", false, false)
	c.Redirect(http.StatusFound, "/signedin")
}

// PublicAuthentication aill authenticate public users of Virgo4
func (svc *ServiceContext) PublicAuthentication(c *gin.Context) {
	log.Printf("Public signin request; checking parameters")
	var auth struct {
		Barcode  string `json:"barcode"`
		Password string `json:"password"`
	}
	if err := c.BindJSON(&auth); err != nil {
		log.Printf("Unable to parse params: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	log.Printf("Validate user barcode %s with ILS Connector...", auth.Barcode)
	authURL := fmt.Sprintf("%s/v4/users/%s/check_pin?pin=%s", svc.ILSAPI, auth.Barcode, auth.Password)
	bodyBytes, ilsErr := svc.ILSConnectorGet(authURL)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	if string(bodyBytes) != "valid" {
		log.Printf("ERROR: pin for %s falied authentication", auth.Barcode)
		c.String(http.StatusForbidden, "Authentication failed")
		return
	}

	log.Printf("%s passed pin check", auth.Barcode)

	// Generate new auth token and ersist in v4 user storage
	authToken := xid.New().String()
	err := svc.updateAccessToken(auth.Barcode, authToken)
	if err != nil {
		log.Printf("WARN: Unable to persist user %s access token %v", auth.Barcode, err)
	}

	// Generate a cookie with auth info
	authStr := fmt.Sprintf("%s|%s|pin", auth.Barcode, authToken)
	c.SetCookie("v4_auth_user", authStr, 3600*24, "/", "", false, false)
	c.String(http.StatusOK, auth.Barcode)
}

// updateAccessToken checks if the user has an acces token and if it matches.
// If no user found, create a new one and set access token. If token exists and
// doesn't match fail.
func (svc *ServiceContext) updateAccessToken(userID string, token string) error {
	var user V4User
	q := svc.DB.NewQuery(`select * from users where virgo4_id={:id}`)
	q.Bind(dbx.Params{"id": userID})
	err := q.One(&user)
	if err != nil {
		log.Printf("User %s does not exist, creating and setting auth token", userID)
		user := V4User{ID: 0, Virgo4ID: userID, AuthToken: token,
			AuthUpdatedAt: time.Now(), SignedIn: true, Preferences: "{}"}
		return svc.DB.Model(&user).Exclude("BookMarkFolders").Insert()
	}

	log.Printf("User found; details: %+v", user)
	log.Printf("Updating access token")
	user.AuthToken = token
	user.AuthUpdatedAt = time.Now()
	user.SignedIn = true
	err = svc.DB.Model(&user).Exclude("BookMarkFolders").Update()
	if err != nil {
		log.Printf("WARN: Unable to update user %s auth token: %v", userID, err)
	}

	return nil
}

// SignoutUser ends the auth session for the target user. All session tracking
// data should be cleaned up
func (svc *ServiceContext) SignoutUser(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Sign out user %s", userID)

	var user V4User
	q := svc.DB.NewQuery(`select * from users where virgo4_id={:id}`)
	q.Bind(dbx.Params{"id": userID})
	err := q.One(&user)
	if err != nil {
		log.Printf("WARN: attempt to sign out user %s that has no user record", userID)
	} else {
		user.AuthUpdatedAt = time.Now()
		user.SignedIn = false
		err := svc.DB.Model(&user).Exclude("BookMarkFolders").Update()
		if err != nil {
			log.Printf("WARN: Unable to update users table for %s: %v", userID, err)
		}
	}

	c.SetCookie("v4_auth_user", "invalid", -1, "/", "", false, false)
	c.String(http.StatusOK, "signedout")
}

// AuthMiddleware is middleware that checks for a user auth token in the
// Authorization header. For now, it does nothing but ensure token presence.
func (svc *ServiceContext) AuthMiddleware(c *gin.Context) {
	token, err := getBearerToken(c.Request.Header.Get("Authorization"))
	if err != nil {
		log.Printf("Authentication failed: [%s]", err.Error())
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	if token == "undefined" {
		log.Printf("Authentication failed; bearer token is undefined")
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	// add the cookie to the request context so other handlers can access it.
	c.Set("token", token)
	log.Printf("got bearer token: [%s]", token)
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
