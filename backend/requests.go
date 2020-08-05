package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// Baese request structure for ILLiad POST /transaction
type illiadRequest struct {
	Username          string
	NotWantedAfter    string
	RequestType       string
	ProcessType       string
	DocumentType      string
	TransactionStatus string
}

// Extenstion of the basic request to include fields necessary for Scan requests
type illiadScanRequest struct {
	*illiadRequest
	PhotoJournalTitle          string
	PhotoArticleTitle          string
	PhotoArticleAuthor         string
	PhotoJournalVolume         string
	PhotoJournalIssue          string
	PhotoJournalMonth          string
	PhotoJournalYear           string
	PhotoJournalInclusivePages string
	ItemNumber                 string
	ISSN                       string
	ESPNumber                  string
	Location                   string
	AcceptNonEnglish           bool
}

// Extension of basic request to include fields necessary for Loan/Borrow requests
type illiadBorrowRequest struct {
	*illiadRequest
	LoanTitle          string
	LoanAuthor         string
	LoanPublisher      string
	PhotoJournalVolume string
	LoanDate           string
	LoanEdition        string
	ISSN               string
	ESPNumber          string
	CitedIn            string
	AcceptNonEnglish   bool
	DeliveryMethod     string
}

type illiadNote struct {
	Note     string
	NoteType string
}

func illaidLibraryMapping(v4Lib string) string {
	libs := map[string]string{
		"ALDERMAN":  "ALDERMAN",
		"ASTRONOMY": "ASTR",
		"CLEMONS":   "CLEM",
		"DARDEN":    "DARDEN",
		"EDUCATION": "EDUC",
		"FINE-ARTS": "FINE ARTS",
		"HEALTHSCI": "HSL",
		"LAW":       "LAW",
		"LEO":       "LEO",
		"MATH":      "MATH",
		"MUSIC":     "MUSIC",
		"PHYSICS":   "PHYS",
		"SCI-ENG":   "SEL",
	}
	if val, ok := libs[v4Lib]; ok {
		return val
	}
	log.Printf("ERROR: Unrecognized library in ILLiad request: %s", v4Lib)
	return v4Lib
}

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

// CreateBorrowRequest sends a borrow request to ILLiad for A/V or non-A/V-items
func (svc *ServiceContext) CreateBorrowRequest(c *gin.Context) {
	var req struct {
		BorrowType    string `json:"borrowType"`
		DocumentType  string `json:"doctype"`
		DateNeeded    string `json:"date"`
		Title         string `json:"title"`
		Author        string `json:"author"`
		Publisher     string `json:"publisher"`
		Volume        string `json:"volume"`
		Year          string `json:"year"`
		Edition       string `json:"edition"`
		Format        string `json:"format"`
		Pages         string `json:"pages"`
		ISSN          string `json:"issn"`
		OCLC          string `json:"oclc"`
		CitedIn       string `json:"cited"`
		AnyLanguage   string `json:"anyLanguage"`
		Notes         string `json:"notes"`
		PickupLibrary string `json:"pickup"`
	}
	err := c.ShouldBindJSON(&req)
	if err != nil {
		log.Printf("ERROR: Unable to parse request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	v4Claims, error := getJWTClaims(c)
	if error != nil {
		log.Printf("ERROR: %s", error.Error())
		c.String(http.StatusUnauthorized, err.Error())
		return
	}

	log.Printf("Process borrow from %s for %s '%s'", v4Claims.UserID, req.BorrowType, req.Title)
	illiadReq := illiadRequest{Username: v4Claims.UserID, RequestType: "Loan", ProcessType: "Borrowing", NotWantedAfter: req.DateNeeded}
	borrowReq := illiadBorrowRequest{LoanTitle: req.Title, LoanAuthor: req.Author, LoanDate: req.Year}
	if req.BorrowType == "AV" {
		log.Printf("This is an A/V request")
		illiadReq.DocumentType = "Audio/Video"
		illiadReq.TransactionStatus = "Awaiting Video Processing"
		borrowReq.LoanEdition = req.Format
		borrowReq.illiadRequest = &illiadReq
	} else {
		log.Printf("This is an Item request")
		illiadReq.DocumentType = req.DocumentType
		illiadReq.TransactionStatus = "Awaiting Request Processing"
		borrowReq.LoanPublisher = req.Publisher
		borrowReq.PhotoJournalVolume = req.Volume
		borrowReq.LoanEdition = req.Edition
		borrowReq.ESPNumber = req.OCLC
		borrowReq.ISSN = req.ISSN
		borrowReq.CitedIn = req.CitedIn
		borrowReq.AcceptNonEnglish = (req.AnyLanguage == "true")
		borrowReq.DeliveryMethod = illaidLibraryMapping(req.PickupLibrary)
		borrowReq.illiadRequest = &illiadReq
	}

	rawResp, illErr := svc.ILLiadRequest("POST", "/transaction", borrowReq)
	if illErr != nil {
		c.JSON(illErr.StatusCode, illErr.Message)
		return
	}

	// parse transaction number from response
	var illadResp struct {
		TransactionNumber int
	}
	json.Unmarshal([]byte(rawResp), &illadResp)
	if req.Notes != "" {
		noteReq := illiadNote{Note: req.Notes, NoteType: "Staff"}
		_, illErr = svc.ILLiadRequest("POST", fmt.Sprintf("/transaction/%d/notes", illadResp.TransactionNumber), noteReq)
		if illErr != nil {
			log.Printf("WARN: unable to add note to borrow request %d: %s", illadResp.TransactionNumber, illErr.Message)
		}
	}

	c.JSON(http.StatusOK, illadResp)
}

// CreateStandaloneScan send a request for a standalone scan to ILLiad
func (svc *ServiceContext) CreateStandaloneScan(c *gin.Context) {
	type scanRequest struct {
		Course       string `json:"course"`
		DateNeeded   string `json:"date"`
		PersonalCopy string `json:"personalCopy"`
		Title        string `json:"title"`
		Author       string `json:"author"`
		Work         string `json:"work"`
		Volume       string `json:"volume"`
		Issue        string `json:"issue"`
		Month        string `json:"month"`
		Year         string `json:"year"`
		Pages        string `json:"pages"`
		ISSN         string `json:"issn"`
		OCLC         string `json:"oclc"`
		AnyLanguage  string `json:"anyLanguage"`
	}
	var scanReq scanRequest
	err := c.ShouldBindJSON(&scanReq)
	if err != nil {
		log.Printf("ERROR: Unable to parse request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	v4Claims, error := getJWTClaims(c)
	if error != nil {
		log.Printf("ERROR: %s", error.Error())
		c.String(http.StatusUnauthorized, err.Error())
		return
	}

	log.Printf("Process standalone instructional scan request from %s for  '%s'", v4Claims.UserID, scanReq.Title)
	illiadReq := illiadRequest{Username: v4Claims.UserID, RequestType: "Article", ProcessType: "DocDel",
		DocumentType: "Collab", NotWantedAfter: scanReq.DateNeeded, TransactionStatus: "Awaiting DD Scanning Processing"}
	illadScanReq := illiadScanRequest{illiadRequest: &illiadReq, PhotoJournalTitle: scanReq.Work, PhotoArticleTitle: scanReq.Title,
		PhotoArticleAuthor: scanReq.Author, PhotoJournalVolume: scanReq.Volume, PhotoJournalIssue: scanReq.Issue,
		PhotoJournalMonth: scanReq.Month, PhotoJournalYear: scanReq.Year, PhotoJournalInclusivePages: scanReq.Pages,
		ISSN: scanReq.ISSN, ESPNumber: scanReq.OCLC,
	}
	if scanReq.AnyLanguage == "true" {
		illadScanReq.AcceptNonEnglish = true
	}
	if scanReq.PersonalCopy == "true" {
		illadScanReq.Location = "Personal Copy"
	}

	rawResp, illErr := svc.ILLiadRequest("POST", "/transaction", illadScanReq)
	if illErr != nil {
		c.JSON(illErr.StatusCode, illErr.Message)
		return
	}

	// parse transaction number from response
	var illadResp struct {
		TransactionNumber int
	}
	json.Unmarshal([]byte(rawResp), &illadResp)

	// use transaction number to add a note to the request containing course info
	noteReq := illiadNote{Note: scanReq.Course, NoteType: "Staff"}
	_, illErr = svc.ILLiadRequest("POST", fmt.Sprintf("/transaction/%d/notes", illadResp.TransactionNumber), noteReq)
	if illErr != nil {
		log.Printf("WARN: unable to add note to scan %d: %s", illadResp.TransactionNumber, illErr.Message)
	}

	c.JSON(http.StatusOK, illadResp)
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

	v4Claims, error := getJWTClaims(c)
	if error != nil {
		log.Printf("ERROR: %s", error.Error())
		c.String(http.StatusUnauthorized, err.Error())
		return
	}

	// First, attempt the ILLiad POST... convert into required structure
	log.Printf("Process scan request from %s for barcode %s", v4Claims.UserID, scanReq.ItemBarcode)
	illiadReq := illiadRequest{Username: v4Claims.UserID, RequestType: "Article", ProcessType: "DocDel",
		DocumentType: scanReq.IlliadType}
	illadScanReq := illiadScanRequest{illiadRequest: &illiadReq,
		PhotoJournalTitle: scanReq.Title, PhotoArticleTitle: scanReq.Chapter,
		PhotoArticleAuthor: scanReq.Author, PhotoJournalVolume: scanReq.Volume, PhotoJournalIssue: scanReq.Issue,
		PhotoJournalYear: scanReq.Year, PhotoJournalInclusivePages: scanReq.Pages,
		ItemNumber: scanReq.ItemBarcode, ISSN: scanReq.Issn}
	if scanReq.IlliadType == "Article" {
		illadScanReq.TransactionStatus = "Awaiting Document Delivery Processing"
	} else {
		illadScanReq.TransactionStatus = "Awaiting Collab Processing"
	}

	rawResp, illErr := svc.ILLiadRequest("POST", "/transaction", illadScanReq)
	if illErr != nil {
		// if the first ILLiad request fails, notify user and exit
		c.JSON(illErr.StatusCode, illErr.Message)
		return
	}

	// parse transaction number from response
	var illadResp struct {
		TransactionNumber int
	}
	json.Unmarshal([]byte(rawResp), &illadResp)

	if scanReq.Notes != "" {
		noteReq := illiadNote{Note: scanReq.Notes, NoteType: "Staff"}
		_, illErr = svc.ILLiadRequest("POST", fmt.Sprintf("/transaction/%d/notes", illadResp.TransactionNumber), noteReq)
		if illErr != nil {
			log.Printf("WARN: unable to add note to scan %d: %s", illadResp.TransactionNumber, illErr.Message)
		}
	}

	type ilsScanRequest struct {
		ItemBarcode   string `json:"itemBarcode"`
		PickupLibrary string `json:"pickupLibrary"`
		IlliadTN      string `json:"illiadTN"`
	}

	ilsScan := ilsScanRequest{
		ItemBarcode:   scanReq.ItemBarcode,
		PickupLibrary: scanReq.PickupLibrary,
		IlliadTN:      fmt.Sprintf("%d", illadResp.TransactionNumber),
	}

	createHoldURL := fmt.Sprintf("%s/v4/requests/scan", svc.ILSAPI)
	bodyBytes, ilsErr := svc.ILSConnectorPost(createHoldURL, ilsScan, c.GetString("jwt"))
	if ilsErr != nil {
		// The ILLiad request was successful so the item needs to be moved to a special queue
		// then fail the response
		type illiadMove struct{ Status string }
		moveReq := illiadMove{Status: "Virgo Hold Error"}
		_, qErr := svc.ILLiadRequest("PUT", fmt.Sprintf("/transaction/%d/route", illadResp.TransactionNumber), moveReq)
		if qErr != nil {
			log.Printf("WARN: unable to add note to scan %d: %s", illadResp.TransactionNumber, qErr.Message)
		}
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

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
