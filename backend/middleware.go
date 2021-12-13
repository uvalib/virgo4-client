package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/uvalib/virgo4-jwt/v4jwt"
)

// UserMiddleware will extract the userID from params and lookup a DB ID for that user.
// It also verifies the JWT user matches the provided ID
// If one cannot be found, the request will be aborted
func (svc *ServiceContext) UserMiddleware(c *gin.Context) {
	uid := c.Param("uid")
	var user User
	resp := svc.GDB.Where("virgo4_id = ?", uid).First(&user)
	if resp.Error != nil {
		log.Printf("ERROR: couldn't find user %s: %v", uid, resp.Error.Error())
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	claims, error := getJWTClaims(c)
	if error != nil {
		log.Printf("ERROR: %s", error.Error())
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	if claims.UserID != uid {
		log.Printf("ERROR: user %s in URL does not match JWT", uid)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	log.Printf("User %s has virgo_id %d", uid, user.ID)
	c.Set("v4id", user.ID)
	c.Next()
}

// AuthMiddleware is middleware that checks for a user auth token in the
// Authorization header. For now, it does nothing but ensure token presence.
func (svc *ServiceContext) AuthMiddleware(c *gin.Context) {
	log.Printf("Authorize access to %s", c.Request.URL)
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
	v4Claims, jwtErr := v4jwt.Validate(tokenStr, svc.JWTKey)
	if jwtErr != nil {
		log.Printf("JWT signature for %s is invalid: %s", tokenStr, jwtErr.Error())
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	// add the parsed claims and signed JWT string to the request context so other handlers can access it.
	c.Set("jwt", tokenStr)
	c.Set("claims", v4Claims)
	log.Printf("got bearer token: [%s]: %+v", tokenStr, v4Claims)
	c.Next()
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
