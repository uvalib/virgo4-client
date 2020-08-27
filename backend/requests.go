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
	CallNumber                 string
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
	ItemInfo4          string
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
		c.String(http.StatusUnauthorized, error.Error())
		return
	}

	log.Printf("Process borrow from %s for %s '%s'", v4Claims.UserID, req.BorrowType, req.Title)
	illiadReq := illiadRequest{Username: v4Claims.UserID, RequestType: "Loan", ProcessType: "Borrowing",
		NotWantedAfter: req.DateNeeded}
	borrowReq := illiadBorrowRequest{LoanTitle: req.Title, LoanAuthor: req.Author, LoanDate: req.Year,
		ItemInfo4: illaidLibraryMapping(req.PickupLibrary)}
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

// CreateOpenURLRequest will send an openURL request to ILLiad
func (svc *ServiceContext) CreateOpenURLRequest(c *gin.Context) {
	var req struct {
		RequestType string `json:"requestType"`
		DocType     string `json:"documentType"`
		ProcessType string `json:"processType"`
		Title       string `json:"title"`
		Article     string `json:"article"`
		Author      string `json:"author"`
		Publisher   string `json:"publisher"`
		Edition     string `json:"edition"`
		Volume      string `json:"volume"`
		Issue       string `json:"issue"`
		Month       string `json:"month"`
		Year        string `json:"year"`
		Pages       string `json:"pages"`
		ISSN        string `json:"issn"`
		OCLC        string `json:"oclc"`
		ByDate      string `json:"bydate"`
		AnyLanguage string `json:"anylanguage"`
		CitedIn     string `json:"citedin"`
		Notes       string `json:"notes"`
		Pickup      string `json:"pickup"`
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
		c.String(http.StatusUnauthorized, error.Error())
		return
	}

	log.Printf("Process OpenURL %s request from %s for '%s'", req.DocType, v4Claims.UserID, req.Title)
	illiadReq := illiadRequest{Username: v4Claims.UserID, RequestType: req.RequestType,
		ProcessType: req.ProcessType, DocumentType: req.DocType,
		TransactionStatus: "Awaiting Request Processing", NotWantedAfter: req.ByDate}
	var openURLReq interface{}
	if req.DocType == "Book" {
		borrowReq := illiadBorrowRequest{illiadRequest: &illiadReq, LoanTitle: req.Title,
			LoanAuthor: req.Author, LoanPublisher: req.Publisher, PhotoJournalVolume: req.Volume,
			LoanDate: req.Year, LoanEdition: req.Edition, ISSN: req.ISSN, ESPNumber: req.OCLC,
			CitedIn: req.CitedIn, ItemInfo4: illaidLibraryMapping(req.Pickup)}
		if req.AnyLanguage == "true" {
			borrowReq.AcceptNonEnglish = true
		}
		openURLReq = borrowReq
	} else {
		scanReq := illiadScanRequest{illiadRequest: &illiadReq, PhotoJournalTitle: req.Title,
			PhotoArticleTitle: req.Article, PhotoArticleAuthor: req.Author,
			PhotoJournalVolume: req.Volume, PhotoJournalIssue: req.Issue, PhotoJournalMonth: req.Month,
			PhotoJournalYear: req.Year, PhotoJournalInclusivePages: req.Pages, ISSN: req.ISSN, ESPNumber: req.OCLC}
		openURLReq = scanReq
	}

	rawResp, illErr := svc.ILLiadRequest("POST", "/transaction", openURLReq)
	if illErr != nil {
		log.Printf("WARN: Illiad Error: %s", illErr.Message)
		c.JSON(illErr.StatusCode, "There was an error during your request. You may need to <a href=\"https://www.library.virginia.edu/services/ils/ill/\">set up an Illiad account</a> first.")
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
			log.Printf("WARN: unable to add note to OpenURL request %d: %s", illadResp.TransactionNumber, illErr.Message)
		}
	}

	c.JSON(http.StatusOK, illadResp)
}

// CreateStandaloneScan send a request for a standalone scan to ILLiad
func (svc *ServiceContext) CreateStandaloneScan(c *gin.Context) {
	var req struct {
		ScanType     string `json:"scanType"` // ARTICLE or INSTRUCTIONAL
		DocType      string `json:"doctype"`
		Course       string `json:"course"`
		DateNeeded   string `json:"date"`
		PersonalCopy string `json:"personalCopy"`
		Title        string `json:"title"`
		Article      string `json:"article"`
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
		Notes        string `json:"notes"`
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
		c.String(http.StatusUnauthorized, error.Error())
		return
	}

	log.Printf("Process standalone %s scan request from %s for  '%s'", req.ScanType, v4Claims.UserID, req.Title)
	illiadReq := illiadRequest{
		Username:          v4Claims.UserID,
		RequestType:       "Article",
		NotWantedAfter:    req.DateNeeded,
		TransactionStatus: "Standalone Form Scan Request",
	}
	scanReq := illiadScanRequest{
		illiadRequest:              &illiadReq,
		PhotoArticleAuthor:         req.Author,
		PhotoJournalVolume:         req.Volume,
		PhotoJournalIssue:          req.Issue,
		PhotoJournalMonth:          req.Month,
		PhotoJournalYear:           req.Year,
		PhotoJournalInclusivePages: req.Pages,
		ISSN:                       req.ISSN,
		ESPNumber:                  req.OCLC,
	}
	note := ""
	if req.ScanType == "INSTRUCTIONAL" {
		illiadReq.ProcessType = "DocDel"
		illiadReq.DocumentType = "Collab"
		scanReq.PhotoJournalTitle = req.Work
		scanReq.PhotoArticleTitle = req.Title
		note = req.Course
		if req.AnyLanguage == "true" {
			scanReq.AcceptNonEnglish = true
		}
		if req.PersonalCopy == "true" {
			scanReq.Location = "Personal Copy"
		}
	} else {
		illiadReq.ProcessType = "Borrowing"
		illiadReq.DocumentType = req.DocType
		scanReq.PhotoJournalTitle = req.Title
		scanReq.PhotoArticleTitle = req.Article
		note = req.Notes
	}

	rawResp, illErr := svc.ILLiadRequest("POST", "/transaction", scanReq)
	if illErr != nil {
		log.Printf("WARN: Illiad Error: %s", illErr.Message)
		c.JSON(illErr.StatusCode, "There was an error during your request. You may need to <a href=\"https://www.library.virginia.edu/services/ils/ill/\">set up an Illiad account</a> first.")
		return
	}

	// parse transaction number from response
	var illadResp struct {
		TransactionNumber int
	}
	json.Unmarshal([]byte(rawResp), &illadResp)

	if note != "" {
		// use transaction number to add a note to the request containing course info or scanning notes
		noteReq := illiadNote{Note: note, NoteType: "Staff"}
		_, illErr = svc.ILLiadRequest("POST", fmt.Sprintf("/transaction/%d/notes", illadResp.TransactionNumber), noteReq)
		if illErr != nil {
			log.Printf("WARN: unable to add note to scan %d: %s", illadResp.TransactionNumber, illErr.Message)
		}
	}

	c.JSON(http.StatusOK, illadResp)
}

// CreateScan first sends the request to Illiad, then ils-connector
func (svc *ServiceContext) CreateScan(c *gin.Context) {
	// ScanRequest contains data for a new Hold
	type scanRequest struct {
		Library     string `json:"library"`
		ItemBarcode string `json:"barcode"`
		CallNumber  string `json:"callNumber"`
		Location    string `json:"location"`
		Issn        string `json:"issn"`
		IlliadType  string `json:"type"`
		Title       string `json:"title"`
		Chapter     string `json:"chapter"`
		Author      string `json:"author"`
		Volume      string `json:"volume"`
		Issue       string `json:"issue"`
		Year        string `json:"year"`
		Pages       string `json:"pages"`
		Notes       string `json:"notes"`
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
		c.String(http.StatusUnauthorized, error.Error())
		return
	}

	// First, attempt the ILLiad POST... convert into required structure
	log.Printf("Process scan request from %s for barcode %s", v4Claims.UserID, scanReq.ItemBarcode)
	illiadReq := illiadRequest{
		Username:          v4Claims.UserID,
		RequestType:       "Article",
		ProcessType:       "DocDel",
		TransactionStatus: "No Hold Scan Request",
		DocumentType:      scanReq.IlliadType,
	}
	illiadScanReq := illiadScanRequest{
		illiadRequest:              &illiadReq,
		PhotoJournalTitle:          scanReq.Title,
		PhotoArticleTitle:          scanReq.Chapter,
		PhotoArticleAuthor:         scanReq.Author,
		PhotoJournalVolume:         scanReq.Volume,
		PhotoJournalIssue:          scanReq.Issue,
		PhotoJournalYear:           scanReq.Year,
		PhotoJournalInclusivePages: scanReq.Pages,
		ISSN:                       scanReq.Issn,
		ItemNumber:                 scanReq.ItemBarcode,
		CallNumber:                 scanReq.CallNumber,
		// Library needs to go in the illiad location field
		Location: scanReq.Library,
	}

	rawResp, illErr := svc.ILLiadRequest("POST", "/transaction", illiadScanReq)
	if illErr != nil {
		// if the first ILLiad request fails, notify user and exit
		c.JSON(illErr.StatusCode, illErr.Message)
		log.Printf("WARN: Illiad Error: %s", illErr.Message)
		c.JSON(illErr.StatusCode, "There was an error during your request. You may need to <a href=\"https://www.library.virginia.edu/services/ils/ill/\">set up an Illiad account</a> first.")
		return
	}

	// parse transaction number from response
	var illiadResp struct {
		TransactionNumber int
	}
	json.Unmarshal([]byte(rawResp), &illiadResp)

	if scanReq.Notes != "" {
		noteReq := illiadNote{Note: scanReq.Notes, NoteType: "Staff"}
		_, illErr = svc.ILLiadRequest("POST", fmt.Sprintf("/transaction/%d/notes", illiadResp.TransactionNumber), noteReq)
		if illErr != nil {
			log.Printf("WARN: unable to add note to scan %d: %s", illiadResp.TransactionNumber, illErr.Message)
		}
	}

	// Only make a hold for certain libraries
	makeHold := false
	for _, holdLoc := range []string{"BY-REQUEST", "STACKS", "OVERSIZE"} {
		if scanReq.Location == holdLoc {
			log.Printf("Making hold for %s", scanReq.ItemBarcode)
			makeHold = true
		}
	}
	if !makeHold {
		log.Printf("No Hold for %s", scanReq.ItemBarcode)
		c.JSON(http.StatusOK, nil)
		return
	}

	type ilsScanRequest struct {
		ItemBarcode   string `json:"itemBarcode"`
		PickupLibrary string `json:"pickupLibrary"`
		IlliadTN      string `json:"illiadTN"`
	}

	// Scans have special pickup libraries
	PickupLibrary := ""
	if scanReq.Library == "BY-REQUEST" {
		PickupLibrary = "LEO"
	} else {
		PickupLibrary = scanReq.Library
	}

	ilsScan := ilsScanRequest{
		ItemBarcode:   scanReq.ItemBarcode,
		PickupLibrary: PickupLibrary,
		IlliadTN:      fmt.Sprintf("%d", illiadResp.TransactionNumber),
	}

	createHoldURL := fmt.Sprintf("%s/v4/requests/scan", svc.ILSAPI)
	_, ilsErr := svc.ILSConnectorPost(createHoldURL, ilsScan, c.GetString("jwt"))
	if ilsErr != nil {
		// The ILLiad request was successful so the item needs to be moved to a special queue
		// then fail the response
		type illiadMove struct{ Status string }
		moveReq := illiadMove{Status: "Virgo Hold Error"}
		_, qErr := svc.ILLiadRequest("PUT", fmt.Sprintf("/transaction/%d/route", illiadResp.TransactionNumber), moveReq)
		if qErr != nil {
			log.Printf("WARN: unable to update scan status %d: %s", illiadResp.TransactionNumber, qErr.Message)
		}
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	// Update Illiad status after successful hold
	type illiadMove struct{ Status string }
	moveReq := illiadMove{Status: "Scan Request - Hold Placed"}
	_, qErr := svc.ILLiadRequest("PUT", fmt.Sprintf("/transaction/%d/route", illiadResp.TransactionNumber), moveReq)
	if qErr != nil {
		log.Printf("WARN: unable to update scan status %d: %s", illiadResp.TransactionNumber, qErr.Message)
	}

	//TODO: update illiad with the actual hold barcode if necessary

	c.JSON(http.StatusOK, nil)
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
	_, ilsErr := svc.ILSConnectorDelete(deleteHoldURL, c.GetString("jwt"))
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	c.JSON(http.StatusOK, nil)
}
