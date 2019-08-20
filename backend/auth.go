package main

import (
	"encoding/xml"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rs/xid"
)

// TODO add middleware thagt will intercept all API requests and ensure that
// and auth token is present.

// Authorize is a placeholder API for minting API access tokens.
// This implementation simply generates a random token and returns it.
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
	if svc.DevAuthUser != "" {
		computingID = svc.DevAuthUser
		log.Printf("Using dev auth user ID: %s", computingID)
	}
	if computingID == "" {
		log.Printf("ERROR: Expected auth header not present in request. Not authorized.")
		c.Redirect(http.StatusFound, "/forbidden")
		return
	}
	log.Printf("NetBadge headers are valid. Checking for authorization token...")

	// Now get the authorization token from the v4_auth cookie
	authToken, err := c.Cookie("v4_auth")
	if err != nil {
		log.Printf("ERROR: Unable to read cookie v4_auth: %s", err.Error())
		c.Redirect(http.StatusFound, "/forbidden")
		return
	}
	c.SetCookie("v4_auth", "invalid", -1, "/", "", false, false)
	log.Printf("NetBadge and authorization token valid. %s is authenticated.", computingID)

	// Set auth info in a cookie the client can read and pass along in future requests
	authStr := fmt.Sprintf("%s|%s|netbadge", computingID, authToken)
	log.Printf("AuthSession %s", authStr)
	c.SetCookie("v4_auth_user", authStr, 3600, "/", "", false, false)
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
	authURL := fmt.Sprintf("%s/users/%s/check_pin?pin=%s", svc.ILSAPI, auth.Barcode, auth.Password)
	bodyBytes, ilsErr := svc.ILSConnectorGet(authURL)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	var xmlValidPin bool
	log.Printf("Raw pinCheck response %s", bodyBytes)
	if err := xml.Unmarshal(bodyBytes, &xmlValidPin); err != nil {
		log.Printf("ERROR: unable to parse pin_check  response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	if !xmlValidPin {
		log.Printf("ERROR: pin for %s falied authentication", auth.Barcode)
		c.String(http.StatusForbidden, "Authentication failed")
		return
	}

	log.Printf("%s passed pin check", auth.Barcode)
	authToken, _ := c.Get("token")
	authStr := fmt.Sprintf("%s|%s|public", auth.Barcode, authToken)
	c.SetCookie("v4_auth_user", authStr, 3600, "/", "", false, false)
	c.String(http.StatusOK, auth.Barcode)
}

// SignoutUser ends the auth session for the target user. All session tracking
// data should be cleaned up
func (svc *ServiceContext) SignoutUser(c *gin.Context) {
	userID := c.Param("id")
	log.Printf("Sign out user %s", userID)
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

	// TODO do something with token

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
