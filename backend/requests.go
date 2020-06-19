package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// CreateHold uses ILS Connector V4 API to create a Hold
func (svc *ServiceContext) CreateHold(c *gin.Context) {
	// HoldRequest contains data for a new Hold
	type HoldRequest struct {
		PickupLibrary string `json:"pickupLibrary"`
		ItemBarcode   string `json:"itemBarcode"`
	}
	var HoldReq HoldRequest
	err := c.ShouldBindJSON(&HoldReq)
	if err != nil {
		log.Printf("ERROR: Unable to parse request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	_, signedIn := c.Get("claims")
	if signedIn == false {
		log.Printf("Hold Request requires signin with JWT claims; no claims found")
		c.String(http.StatusBadRequest, "signin required")
		return
	}

	createHoldURL := fmt.Sprintf("%s/v4/requests/hold", svc.ILSAPI)
	bodyBytes, ilsErr := svc.ILSConnectorPost(createHoldURL, HoldReq, c.GetString("jwt"))
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	// Pass through without modification
	var result map[string]interface{}
	json.Unmarshal([]byte(bodyBytes), &result)
	c.JSON(http.StatusOK, result)
}

// CreateScan first sends the request to Illiad, then ils-connector
func (svc *ServiceContext) CreateScan(c *gin.Context) {
	// ScanRequest contains data for a new Hold
	type scanRequest struct {
		PickupLibrary string `json:"library"`
		ItemBarcode   string `json:"barcode"`
		Issn          string `json:"issn"`
		IlliadType    string `json:"type"`
		Title         string `json:"title"`
		Chapter       string `json:"chapter"`
		Author        string `json:"author"`
		Volume        string `json:"volume"`
		Issue         string `json:"issue"`
		Year          string `json:"year"`
		Pages         string `json:"pages"`
		Notes         string `json:"notes"`
	}
	var scanReq scanRequest
	err := c.ShouldBindJSON(&scanReq)
	if err != nil {
		log.Printf("ERROR: Unable to parse request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	_, signedIn := c.Get("claims")
	if signedIn == false {
		log.Printf("Scan Request requires signin with JWT claims; no claims found")
		c.String(http.StatusBadRequest, "Sign in required")
		return
	}

	// TODO Illiad request happens here:

	type ilsScanRequest struct {
		ItemBarcode   string `json:"itemBarcode"`
		PickupLibrary string `json:"pickupLibrary"`
		IlliadTN      string `json:"illiadTN"`
	}

	ilsScan := ilsScanRequest{
		ItemBarcode:   scanReq.ItemBarcode,
		PickupLibrary: scanReq.PickupLibrary,
		IlliadTN:      scanReq.Notes,
	}

	createHoldURL := fmt.Sprintf("%s/v4/requests/scan", svc.ILSAPI)
	bodyBytes, ilsErr := svc.ILSConnectorPost(createHoldURL, ilsScan, c.GetString("jwt"))
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	// TODO Pass back a better response?
	// Pass through without modification
	var result map[string]interface{}
	json.Unmarshal([]byte(bodyBytes), &result)
	c.JSON(http.StatusOK, result)
}

// DeleteHold uses ILS Connector V4 API to delete a Hold
func (svc *ServiceContext) DeleteHold(c *gin.Context) {

	// v4-dev only
	v4HostHeader := c.Request.Header.Get("V4Host")
	if strings.Index(v4HostHeader, "-dev") == 0 && svc.Dev.AuthUser == "" {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	holdID := c.Param("holdID")

	_, signedIn := c.Get("claims")
	if signedIn == false {
		log.Printf("Hold Request requires signin with JWT claims; no claims found")
		c.String(http.StatusBadRequest, "signin required")
		return
	}

	deleteHoldURL := fmt.Sprintf("%s/v4/requests/hold/%s", svc.ILSAPI, holdID)
	bodyBytes, ilsErr := svc.ILSConnectorDelete(deleteHoldURL, c.GetString("jwt"))
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	// Pass through without modification
	var result map[string]interface{}
	json.Unmarshal([]byte(bodyBytes), &result)
	c.JSON(http.StatusOK, result)
}
