package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetAvailability uses ILS Connector V4 API /availability to get details for a Document
func (svc *ServiceContext) GetAvailability(c *gin.Context) {
	titleID := c.Param("id")
	log.Printf("Getting availability for %s with ILS Connector...", titleID)

	availabilityURL := fmt.Sprintf("%s/v4/availability/%s", svc.ILSAPI, titleID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(availabilityURL)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	// Pass through without modification
	var result map[string]interface{}
	json.Unmarshal([]byte(bodyBytes), &result)
	c.JSON(http.StatusOK, result)
}
