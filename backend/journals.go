package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// BrowseJournals will do the initial solr query to find journals where title starts
// with the passed query string
func (svc *ServiceContext) BrowseJournals(c *gin.Context) {
	title := c.Query("title")
	log.Printf("Browse journals where title starts with %s", title)

	c.String(http.StatusOK, "browse for %s", title)
}
