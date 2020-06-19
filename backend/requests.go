package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/uvalib/virgo4-jwt/v4jwt"
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
	claims, signedIn := c.Get("claims")
	if signedIn == false {
		log.Printf("Scan Request requires signin with JWT claims; no claims found")
		c.String(http.StatusBadRequest, "Sign in required")
		return
	}
	v4Claims, ok := claims.(*v4jwt.V4Claims)
	if !ok {
		log.Printf("ERROR: Scan Request with invalid JWT")
		c.String(http.StatusBadRequest, "Sign in required")
		return
	}

	// First, attempt the ILLiad POST... convert into required structure
	log.Printf("Process scan request from %s for barcode %s", v4Claims.UserID, scanReq.ItemBarcode)
	type illiadRequest struct {
		Username                   string
		RequestType                string
		ProcessType                string
		DocumentType               string
		PhotoJournalTitle          string
		PhotoArticleTitle          string
		PhotoArticleAuthor         string
		PhotoJournalVolume         string
		PhotoJournalIssue          string
		PhotoJournalYear           string
		PhotoJournalInclusivePages string
		Note                       string
		ItemNumber                 string
		ISSN                       string
		TransactionStatus          string
	}

	illadReq := illiadRequest{Username: v4Claims.UserID, RequestType: "Article", ProcessType: "DocDel",
		DocumentType: scanReq.IlliadType, PhotoJournalTitle: scanReq.Title, PhotoArticleTitle: scanReq.Chapter,
		PhotoArticleAuthor: scanReq.Author, PhotoJournalVolume: scanReq.Volume, PhotoJournalIssue: scanReq.Issue,
		PhotoJournalYear: scanReq.Year, PhotoJournalInclusivePages: scanReq.Pages, Note: scanReq.Notes,
		ItemNumber: scanReq.ItemBarcode, ISSN: scanReq.Issn}
	if scanReq.IlliadType == "Article" {
		illadReq.TransactionStatus = "Awaiting Document Delivery Processing"
	} else {
		illadReq.TransactionStatus = "Awaiting Collab Processing"
	}

	rawResp, illErr := svc.ILLiadPost("/transaction", illadReq)
	if illErr != nil {
		return
	}
	log.Printf("ILLiad respone: %s", rawResp)
	// TODO Illiad request happens here:
	/*
		Attempt illiad first
		pass: send ILS request with IlliadTN
		fail: send error back to client
		ILS next
		pass: send success back to client
		fail: send error to client, Illiad request goes to a different queue (or something?)
	*/

	// type ilsScanRequest struct {
	// 	ItemBarcode   string `json:"itemBarcode"`
	// 	PickupLibrary string `json:"pickupLibrary"`
	// 	IlliadTN      string `json:"illiadTN"`
	// }

	// ilsScan := ilsScanRequest{
	// 	ItemBarcode:   scanReq.ItemBarcode,
	// 	PickupLibrary: scanReq.PickupLibrary,
	// 	IlliadTN:      scanReq.Notes,
	// }

	// createHoldURL := fmt.Sprintf("%s/v4/requests/scan", svc.ILSAPI)
	// bodyBytes, ilsErr := svc.ILSConnectorPost(createHoldURL, ilsScan, c.GetString("jwt"))
	// if ilsErr != nil {
	// 	c.String(ilsErr.StatusCode, ilsErr.Message)
	// 	return
	// }

	// // TODO Pass back a better response?
	// // Pass through without modification
	// var result map[string]interface{}
	// json.Unmarshal([]byte(bodyBytes), &result)
	// c.JSON(http.StatusOK, result)
	c.String(http.StatusOK, "ok")
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
