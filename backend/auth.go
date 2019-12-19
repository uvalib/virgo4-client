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
	var user V4User
	q := svc.DB.NewQuery(`select * from users where virgo4_id={:id}`)
	q.Bind(dbx.Params{"id": auth.Barcode})
	err := q.One(&user)
	if err != nil {
		log.Printf("User %s does not exist, creating...", auth.Barcode)
		user := V4User{ID: 0, Virgo4ID: auth.Barcode, AuthToken: xid.New().String(),
			AuthTries: 0, LockedOut: false, SignedIn: false, Preferences: "{}"}
		err := svc.DB.Model(&user).Exclude("BookMarkFolders").Insert()
		if err != nil {
			log.Printf("Unable to create new user record %+v", err)
			resp.Message = fmt.Sprintf("Internal Error: %s", err.Error())
			c.JSON(http.StatusInternalServerError, resp)
			return
		}
	} else {
		if user.AuthToken == "" {
			user.AuthToken = xid.New().String()
		}
	}

	if user.LockedOut {
		now := time.Now()
		if now.After(*user.LockedOutUntil) {
			log.Printf("User %s lockout has expired", auth.Barcode)
			user.LockedOut = false
			user.LockedOutUntil = nil
			svc.DB.Model(&user).Exclude("BookMarkFolders").Update()
		} else {
			log.Printf("User %s is currently locked out of their account", auth.Barcode)
			delta := user.LockedOutUntil.Sub(now)
			resp.AttemptsLeft = 0
			resp.LockedOut = true
			resp.Message = fmt.Sprintf("Your account is locked for %d minutes", int(delta.Minutes()))
			c.JSON(http.StatusForbidden, resp)
			return
		}
	}

	log.Printf("Track auth attempt for user %s...", auth.Barcode)
	now := time.Now()
	if user.AuthStartedAt == nil {
		user.AuthStartedAt = &now
		user.AuthTries = 1
	} else {
		// If this attempt is within 1 minute of the start, increment attempt
		// counter. If not, start a new auth tracking session
		delta := now.Sub(*user.AuthStartedAt)
		if delta.Minutes() > 1.0 {
			log.Printf("First auth attempt for %s", auth.Barcode)
			user.AuthStartedAt = &now
			user.AuthTries = 1
		} else {
			log.Printf("Last auth attempt for %s was %1.2f seconds ago", auth.Barcode, delta.Seconds())
			user.AuthTries++
		}
	}
	resp.AttemptsLeft = 5 - user.AuthTries
	svc.DB.Model(&user).Exclude("BookMarkFolders").Update()

	log.Printf("Validate user barcode %s with ILS Connector...", auth.Barcode)
	authURL := fmt.Sprintf("%s/v4/users/%s/check_pin?pin=%s", svc.ILSAPI, auth.Barcode, auth.Password)
	bodyBytes, _ := svc.ILSConnectorGet(authURL)

	if string(bodyBytes) != "valid" {
		// The in verification failed. If this has happened 5 times in a
		// minute, lock out the account for one hour
		log.Printf("ERROR: pin for %s falied authentication", auth.Barcode)
		if user.AuthTries >= 5 {
			log.Printf("User %s account is now locked out for 1 hour", user.Virgo4ID)
			resp.Message = "Authentication failed. Your account is now locked for one hour."
			resp.LockedOut = true
			now := time.Now()
			later := now.Add(time.Hour)
			user.LockedOut = true
			user.LockedOutUntil = &later
			svc.DB.Model(&user).Exclude("BookMarkFolders").Update()
		} else {
			resp.Message = "Authentication failed"
		}
		c.JSON(http.StatusForbidden, resp)
		return
	}

	log.Printf("%s passed pin check", auth.Barcode)
	resp.SignedIn = true

	// Generate new auth token and ersist in v4 user storage
	authToken := xid.New().String()
	err = svc.updateAccessToken(auth.Barcode, authToken)
	if err != nil {
		log.Printf("WARN: Unable to persist user %s access token %v", auth.Barcode, err)
	}

	// Generate a cookie with auth info
	authStr := fmt.Sprintf("%s|%s|pin", auth.Barcode, authToken)
	c.SetCookie("v4_auth_user", authStr, 3600*24, "/", "", false, false)
	c.JSON(http.StatusOK, resp)
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
	user.LockedOut = false
	user.LockedOutUntil = nil
	user.AuthTries = 0
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

	// See if token is associated with a user, and if so, that the user is not locked out
	var user V4User
	q := svc.DB.NewQuery(`select * from users where auth_token={:t}`)
	q.Bind(dbx.Params{"t": token})
	q.One(&user)
	if user.AuthToken == token && user.LockedOut {
		log.Printf("Authentication failed; user %s is locked out", user.Virgo4ID)
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
