package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"strings"
	"text/template"

	"github.com/gin-gonic/gin"
)

// Base request structure for ILLiad POST /transaction
type illiadRequest struct {
	Username          string
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

// IlliadErrorMessage displayed in error modal
const IlliadErrorMessage = "There was an error during your request. You may need to <a target='_blank' href=\"https://www.library.virginia.edu/services/ils/ill/\">set up an Illiad account <i class=\"fal fa-external-link-alt\"></i></a> first."

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
	var holdReq HoldRequest
	err := c.ShouldBindJSON(&holdReq)
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

	log.Printf("INFO: create hold request: %+v", holdReq)
	createHoldURL := fmt.Sprintf("%s/requests/hold", svc.ILSAPI)
	bodyBytes, ilsErr := svc.ILSConnectorPost(createHoldURL, holdReq, c.GetString("jwt"), svc.HTTPClient)
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
	illiadReq := illiadRequest{Username: v4Claims.UserID, RequestType: "Loan", ProcessType: "Borrowing"}
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

	transactionNum, illErr := svc.createILLiadTransaction(borrowReq, req.Notes)
	if illErr != nil {
		log.Printf("WARN: Illiad Error: %s", illErr.Message)
		c.String(illErr.StatusCode, IlliadErrorMessage)
		return
	}
	c.String(http.StatusOK, fmt.Sprintf("%d", transactionNum))
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
		TransactionStatus: "Awaiting Request Processing"}
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

	transactionNum, illErr := svc.createILLiadTransaction(openURLReq, req.Notes)
	if illErr != nil {
		log.Printf("WARN: Illiad Error: %s", illErr.Message)
		c.String(illErr.StatusCode, IlliadErrorMessage)
		return
	}
	c.String(http.StatusOK, fmt.Sprintf("%d", transactionNum))
}

// PDFRemediationRequest generates am illiad request for pdf remediation and uploads the target PDF
func (svc *ServiceContext) pdfRemediationRequest(c *gin.Context) {
	formData, err := c.MultipartForm()
	if err != nil {
		log.Printf("ERROR: unable to get pdf remediation form data: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	// this has already been thru auth middleware so JWT/claims will exist
	v4Claims, _ := getJWTClaims(c)
	jwtIface, _ := c.Get("jwt")
	jwt, _ := jwtIface.(string)

	// pull required data from form fields
	work := formData.Value["work"][0]
	title := formData.Value["title"][0]
	course := formData.Value["course"][0]
	formFile := formData.File["file"][0]

	log.Printf("INFO: process pdf remediation request from %s for course %s, work '%s', title '%s", v4Claims.UserID, course, work, title)
	baseReq := illiadRequest{
		Username:          v4Claims.UserID,
		RequestType:       "Article",
		TransactionStatus: "Remediation Request",
		ProcessType:       "DocDel",
		DocumentType:      "Instructional",
	}
	remediateReq := struct {
		*illiadRequest
		PhotoJournalTitle string
		PhotoArticleTitle string
	}{
		illiadRequest:     &baseReq,
		PhotoJournalTitle: work,
		PhotoArticleTitle: title,
	}

	transactionNum, illErr := svc.createILLiadTransaction(remediateReq, course)
	if illErr != nil {
		log.Printf("WARN: Illiad Error: %s", illErr.Message)
		c.String(illErr.StatusCode, IlliadErrorMessage)
		return
	}

	log.Printf("INFO: pull file %s from request to temporary file", formFile.Filename)
	destFile := path.Join("/tmp", formFile.Filename)
	frmFile, err := formFile.Open()
	if err != nil {
		log.Printf("ERROR: unable to open uploaded file %s: %s", formFile.Filename, err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	defer frmFile.Close()
	out, err := os.Create(destFile)
	if err != nil {
		log.Printf("ERROR: unable to create temp file %s: %s", destFile, err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	defer out.Close()
	_, err = io.Copy(out, frmFile)
	if err != nil {
		log.Printf("ERROR: unable to write temp file %s: %s", destFile, err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	log.Printf("INFO: create new multipart-form with the received file")
	dlFile, oErr := os.Open(destFile)
	if oErr != nil {
		log.Printf("ERROR: unable to open %s so it can be added to a new multipart form: %s", destFile, oErr.Error())
		c.String(http.StatusInternalServerError, oErr.Error())
		return
	}
	defer dlFile.Close()

	formBuff := &bytes.Buffer{}
	formWriter := multipart.NewWriter(formBuff)
	// append the transaction number to the filename sent to the uploader
	fileW, cErr := formWriter.CreateFormFile("file", fmt.Sprintf("%d_%s", transactionNum, formFile.Filename))
	if cErr != nil {
		log.Printf("ERROR: unable to create form file: %s", cErr.Error())
		c.String(http.StatusInternalServerError, cErr.Error())
		return
	}

	_, cpErr := io.Copy(fileW, dlFile)
	if cpErr != nil {
		log.Printf("ERROR: unable to add %s to upload form: %s", formFile.Filename, cpErr.Error())
		c.String(http.StatusInternalServerError, cpErr.Error())
		return
	}

	formWriter.Close() // gotta do this to to get multipart form terminating boundary

	log.Printf("INFO: send form with file to illiad upload service")
	req, _ := http.NewRequest("POST", svc.Illiad.UploadURL, formBuff)
	req.Header.Set("Content-Type", formWriter.FormDataContentType())
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", jwt))
	_, reqErr := svc.SlowHTTPClient.Do(req) // 30 sec timeout. Hopefully big enough
	if reqErr != nil {
		log.Printf("ERROR: upload failed: %s", reqErr.Error())
		return
	}

	c.String(http.StatusOK, fmt.Sprintf("%d", transactionNum))
}

func (svc *ServiceContext) getOutstandingStandaloneRequests(c *gin.Context) {
	v4Claims, _ := getJWTClaims(c)
	resp := struct {
		RemediationRequests   int  `json:"remediationRequests"`
		RemediationLimit      int  `json:"remediationLimit"`
		RemediationDisabled   bool `json:"remediationDisabled"`
		OtherRequests         int  `json:"otherRequests"`
		OtherRequestsLimit    int  `json:"otherRequestsLimit"`
		OtherRequestsDisabled bool `json:"otherRequestsDisabled"`
	}{}

	log.Printf("INFO: get standalone request counts for %s", v4Claims.UserID)
	remediateCnt, err := svc.getOutstandingRemediationRequestCount(v4Claims.UserID)
	if err != nil {
		log.Printf("ERROR: unable to get remediation request count: %s", err.Message)
		c.String(http.StatusInternalServerError, err.Message)
		return
	}

	log.Printf("INFO: user %s has %d outstanding remediation requests", v4Claims.UserID, remediateCnt)
	resp.RemediationRequests = remediateCnt
	resp.RemediationLimit = 10
	resp.RemediationDisabled = (resp.RemediationRequests >= resp.RemediationLimit)

	otherCnt, err := svc.getOutstandingOtherRequestsCount(v4Claims.UserID)
	if err != nil {
		log.Printf("ERROR: unable to get other requests count: %s", err.Message)
		c.String(http.StatusInternalServerError, err.Message)
		return
	}

	// The active request limit by user status should: FACULTY: 50, GRADUATE: 25, EMPLOYEE: 25, UNDERGRAD: 25.
	reqLimit := 25
	if strings.EqualFold(v4Claims.Profile, "FACULTY") {
		reqLimit = 50
	}
	log.Printf("INFO: user %s has %d outstanding non-remediation requests", v4Claims.UserID, otherCnt)
	resp.OtherRequests = otherCnt
	resp.OtherRequestsLimit = reqLimit
	resp.OtherRequestsDisabled = (resp.OtherRequests >= resp.OtherRequestsLimit)

	c.JSON(http.StatusOK, resp)
}

func (svc *ServiceContext) getOutstandingRemediationRequestCount(userID string) (int, *RequestError) {
	log.Printf("INFO: get pdf remediation count for %s", userID)

	// Users are only allowed a maximum of 5 active PDF remediation requests.
	// Active requests are identified by TransactionStatus matching the list below
	activeStatuses := []string{"Remediation Request",
		"Remediation - A (Low)", "Remediation - B (Medium)", "Remediation - C (High)",
		"Remediation - In Process", "Remediation - Is Completed", "SDAC - Whole Book Requests"}

	// build a transaction query with a filter for these statuses
	filter := make([]string, 0)
	for _, s := range activeStatuses {
		filter = append(filter, fmt.Sprintf("TransactionStatus eq '%s'", s))
	}
	filterStr := fmt.Sprintf("$filter=(%s)", strings.Join(filter, " or "))
	filterStr = strings.ReplaceAll(filterStr, " ", "+")
	queryURI := fmt.Sprintf("/Transaction/UserRequests/%s?%s", userID, filterStr)
	resp, respErr := svc.ILLiadRequest("GET", queryURI, nil)
	if respErr != nil {
		return 0, respErr
	}

	var parsed []any
	parseErr := json.Unmarshal(resp, &parsed)
	if parseErr != nil {
		return 0, &RequestError{StatusCode: http.StatusInternalServerError, Message: parseErr.Error()}
	}

	return len(parsed), nil
}

func (svc *ServiceContext) getOutstandingOtherRequestsCount(userID string) (int, *RequestError) {
	log.Printf("INFO: get other standalone requests counts for %s", userID)
	return 0, nil
}

// CreateStandaloneScan send a request for a standalone scan to ILLiad
func (svc *ServiceContext) CreateStandaloneScan(c *gin.Context) {
	var req struct {
		ScanType     string `json:"scanType"` // ARTICLE or INSTRUCTIONAL
		DocType      string `json:"doctype"`
		Course       string `json:"course"`
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
		illiadReq.DocumentType = "Instructional"
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

	transactionNum, illErr := svc.createILLiadTransaction(scanReq, note)
	if illErr != nil {
		log.Printf("WARN: Illiad Error: %s", illErr.Message)
		c.String(illErr.StatusCode, IlliadErrorMessage)
		return
	}
	c.String(http.StatusOK, fmt.Sprintf("%d", transactionNum))
}

func (svc *ServiceContext) createILLiadTransaction(payload any, note string) (int, *RequestError) {
	log.Printf("INFO: create illiad transaction for %+v", payload)
	rawResp, illErr := svc.ILLiadRequest("POST", "/transaction", payload)
	if illErr != nil {
		return 0, illErr
	}

	// parse transaction number from response
	var illadResp struct {
		TransactionNumber int
	}
	json.Unmarshal([]byte(rawResp), &illadResp)
	log.Printf("INFO: transaction %d created", illadResp.TransactionNumber)

	if note != "" {
		log.Printf("INFO: add note [%s] to illiad transaction %d", note, illadResp.TransactionNumber)
		noteReq := illiadNote{Note: note, NoteType: "Staff"}
		_, illErr = svc.ILLiadRequest("POST", fmt.Sprintf("/transaction/%d/notes", illadResp.TransactionNumber), noteReq)
		if illErr != nil {
			log.Printf("WARN: unable to add note to scan %d: %s", illadResp.TransactionNumber, illErr.Message)
		}
	}
	return illadResp.TransactionNumber, nil
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

	transactionNum, illErr := svc.createILLiadTransaction(illiadScanReq, scanReq.Notes)
	if illErr != nil {
		log.Printf("WARN: Illiad Error: %s", illErr.Message)
		c.String(illErr.StatusCode, IlliadErrorMessage)
		return
	}

	// Only make a hold for certain libraries
	makeHold := false
	for _, holdLoc := range []string{"BY-REQUEST", "STACKS", "OVERSIZE", "RESERVE", "REFERENCE", "CUR-PER", "JOURNALS"} {
		if scanReq.Location == holdLoc {
			log.Printf("Making hold for %s\n%+v", scanReq.ItemBarcode, scanReq)
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
	switch scanReq.Library {
	case
		"CLEMONS",
		"FINE-ARTS",
		"SCI-ENG",
		"MUSIC",
		"MAIN":
		PickupLibrary = "LEO"
	default:
		PickupLibrary = scanReq.Library
	}

	ilsScan := ilsScanRequest{
		ItemBarcode:   scanReq.ItemBarcode,
		PickupLibrary: PickupLibrary,
		IlliadTN:      fmt.Sprintf("%d", transactionNum),
	}

	createHoldURL := fmt.Sprintf("%s/requests/scan", svc.ILSAPI)
	_, ilsErr := svc.ILSConnectorPost(createHoldURL, ilsScan, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		// The ILLiad request was successful so the item needs to be moved to a special queue
		// then fail the response
		type illiadMove struct{ Status string }
		moveReq := illiadMove{Status: "Virgo Hold Error"}
		_, qErr := svc.ILLiadRequest("PUT", fmt.Sprintf("/transaction/%d/route", transactionNum), moveReq)
		if qErr != nil {
			log.Printf("WARN: unable to update scan status %d: %s", transactionNum, qErr.Message)
		}
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	// Update Illiad status after successful hold
	type illiadMove struct{ Status string }
	moveReq := illiadMove{Status: "Scan Request - Hold Placed"}
	_, qErr := svc.ILLiadRequest("PUT", fmt.Sprintf("/transaction/%d/route", transactionNum), moveReq)
	if qErr != nil {
		log.Printf("WARN: unable to update scan status %d: %s", transactionNum, qErr.Message)
	}

	//TODO: update illiad with the actual hold barcode if necessary

	c.JSON(http.StatusOK, nil)
}

// DeleteHold If the hold is cancellable use ILS Connector V4 API to delete it,
// otherwise send an email to lib-circ with the cancellation request
func (svc *ServiceContext) DeleteHold(c *gin.Context) {

	type holdData struct {
		HoldID            string `json:"id"`
		UserID            string `json:"userID"`
		Title             string `json:"title"`
		Author            string `json:"author"`
		Barcode           string `json:"barcode"`
		CallNumber        string `json:"callNumber"`
		Status            string `json:"status"`
		PickupLocation    string `json:"pickupLocation"`
		PlacedDate        string `json:"placedDate"`
		ItemStatus        string `json:"itemStatus"`
		Cancellable       bool   `json:"cancellable"`
		ConfirmationEmail string `json:"confirmationEmail"`
	}
	var holdToCancel holdData
	err := c.ShouldBindJSON(&holdToCancel)
	if err != nil {
		log.Printf("ERROR: Unable to parse hold cancellation request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	v4Claims, err := getJWTClaims(c)
	if err != nil {
		c.String(http.StatusBadRequest, "You must be signed in")
		return
	}
	holdToCancel.UserID = v4Claims.UserID

	// Hold is able to be cancelled automatically
	if holdToCancel.Cancellable {
		deleteHoldURL := fmt.Sprintf("%s/requests/hold/%s", svc.ILSAPI, holdToCancel.HoldID)
		_, ilsErr := svc.ILSConnectorDelete(deleteHoldURL, c.GetString("jwt"))
		if ilsErr != nil {
			c.String(ilsErr.StatusCode, ilsErr.Message)
			return
		}

	} else {
		// Send a lib-circ email to have the hold cancelled manually
		var renderedEmail bytes.Buffer
		tpl := template.Must(template.New("cancel_hold.txt").ParseFiles("templates/cancel_hold.txt"))
		err = tpl.Execute(&renderedEmail, holdToCancel)
		if err != nil {
			log.Printf("ERROR: Unable to render cancel hold request email: %s", err.Error())
			c.String(http.StatusInternalServerError, err.Error())
			return
		}

		//to := []string{"lib-circ@virginia.edu"}
		to := []string{"lib-circ@virginia.edu"}
		confirmation := holdToCancel.ConfirmationEmail

		eRequest := emailRequest{Subject: "Cancel Hold Request", To: to, ReplyTo: confirmation, CC: confirmation, From: svc.SMTP.Sender, Body: renderedEmail.String()}
		sendErr := svc.SendEmail(&eRequest)
		if sendErr != nil {
			log.Printf("ERROR: Unable to send hold cancellation email: %s", sendErr.Error())
			c.String(http.StatusInternalServerError, sendErr.Error())
			return
		}

	}

	c.JSON(http.StatusOK, nil)
}
