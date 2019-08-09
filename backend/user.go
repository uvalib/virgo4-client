package main

import (
	"encoding/xml"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// UserInfo contains ILS connector details for a user
type UserInfo struct {
	DisplayName        string `xml:"displayName"`
	Title              string `xml:"title"`
	Profile            string `xml:"profile"`
	OrganizationalUnit string `xml:"organizationalUnit"`
	Address            string `xml:"physicalDelivery"`
	Email              string `xml:"email"`
	TotalCheckouts     int    `xml:"totalCheckouts"`
	TotalHolds         int    `xml:"totalHolds"`
	TotalOverdue       int    `xml:"totalOverdue"`
	TotalRecalls       int    `xml:"totalRecalls"`
	TotalReserves      int    `xml:"totalReserves"`
}

// GetUser uses ILS Connector V2 API /users to get details for a user
func (svc *ServiceContext) GetUser(c *gin.Context) {
	userID := c.Param("id")
	log.Printf("Get info for user %s with ILS Connector...", userID)

	userURL := fmt.Sprintf("%s/users/%s", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	var user UserInfo
	log.Printf("Raw user response %s", bodyBytes)
	if err := xml.Unmarshal(bodyBytes, &user); err != nil {
		log.Printf("ERROR: unable to parse user response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, user)
}
