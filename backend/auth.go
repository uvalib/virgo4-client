package main

import (
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
