package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/xid"
)

// Authorize is a placeholder API for minting API access tokens.
// This implementation simply generates a random token and returns it.
func authorize(c *gin.Context) {
	log.Printf("Generate API access token")
	token := xid.New().String()
	c.String(http.StatusOK, token)
}

// NetbadgeAuthentication checks headers for NetBadge authentication
// information. Upon success or failure redirect to the appropriate location.
// NOTE: this is called directly from the front-end as a transient page with
// window.location.href = "/authenticate/netbadge" to force it through
// NetBadge authentication.
func netbadgeAuthentication(c *gin.Context) {
	log.Printf("Checking authentication headers...")
	computingID := c.GetHeader("remote_user")
	devMode := false
	if devAuthUser != "" {
		computingID = devAuthUser
		devMode = true
		log.Printf("Using dev auth user ID: %s", computingID)
	}
	if computingID == "" {
		log.Printf("ERROR: Expected auth header not present in request. Not authorized.")
		c.Redirect(http.StatusFound, "/forbidden")
		return
	}
	log.Printf("NetBadge headers are valid. Checking for authorization token...")

	// Now get the authorization token from the v4_token cookie
	authToken, err := c.Cookie("v4_auth")
	if err != nil {
		log.Printf("ERROR: Unable to read cookie v4_token: %s", err.Error())
		c.Redirect(http.StatusFound, "/forbidden")
		return
	}
	log.Printf("NetBadge and authorization token valid. %s is authenticated.", computingID)

	// Set auth info into in an open cookie that the client can use for a one-off validation.
	// Also place in a secure, http-only cookie that the browser can't touch.
	// It will be passed along on all admin api requests.
	authStr := fmt.Sprintf("%s|%s|netbadge", computingID, authToken)
	log.Printf("AuthSession %s", authStr)
	c.SetCookie("v4_auth_user", authStr, 3600, "/", "", false, false)
	if devMode {
		c.SetCookie("v4_auth_session", authStr, 0, "/", "", false, true)
	} else {
		c.SetCookie("v4_auth_session", authStr, 0, "/", "", true, true)
	}
	c.Redirect(http.StatusFound, "/signedin")
}

// PublicAuthentication aill authenticate public users of Virgo4
func publicAuthentication(c *gin.Context) {
	c.String(http.StatusNotImplemented, "Not yet implemented")
}
