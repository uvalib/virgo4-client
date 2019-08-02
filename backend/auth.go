package main

import (
	"encoding/xml"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"

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

	// Now get the authorization token from the v4_auth cookie
	authToken, err := c.Cookie("v4_auth")
	if err != nil {
		log.Printf("ERROR: Unable to read cookie v4_auth: %s", err.Error())
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
	timeout := time.Duration(5 * time.Second)
	client := http.Client{
		Timeout: timeout,
	}
	authURL := fmt.Sprintf("%s/users/%s/check_pin?pin=%s", ilsAPI, auth.Barcode, auth.Password)
	resp, err := client.Get(authURL)
	if err != nil {
		status := http.StatusBadRequest
		errMsg := err.Error()
		if strings.Contains(err.Error(), "Timeout") {
			status = http.StatusRequestTimeout
			errMsg = fmt.Sprintf("pin_check for %s timed out", auth.Barcode)
		} else if strings.Contains(err.Error(), "connection refused") {
			status = http.StatusServiceUnavailable
			errMsg = fmt.Sprintf("%s refused connection", ilsAPI)
		}
		log.Printf("ERROR: pin_check request failed: %s", errMsg)
		c.String(status, errMsg)
		return
	}

	defer resp.Body.Close()
	bodyBytes, _ := ioutil.ReadAll(resp.Body)
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
	c.String(http.StatusOK, auth.Barcode)
}
