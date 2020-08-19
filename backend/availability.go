package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"reflect"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/go-querystring/query"
)

// AvailabilityData coming from ILS Connector
type AvailabilityData struct {
	Availability struct {
		ID             string          `json:"title_id"`
		Columns        []string        `json:"columns"`
		Items          []Item          `json:"items"`
		RequestOptions []RequestOption `json:"request_options"`
	} `json:"availability"`
}

// Item represents a single item inside availability
type Item struct {
	Barcode         string                   `json:"barcode"`
	OnShelf         bool                     `json:"on_shelf"`
	Unavailable     bool                     `json:"unavailable"`
	Notice          string                   `json:"notice"`
	Fields          []map[string]interface{} `json:"fields"`
	Library         string                   `json:"library"`
	LibraryID       string                   `json:"library_id"`
	CurrentLocation string                   `json:"current_location"`
	HomeLocationID  string                   `json:"home_location_id"`
	CallNumber      string                   `json:"call_number"`
	Volume          string                   `json:"volume"`
	SCNotes         string                   `json:"special_collections_location"`
}

// RequestOption is a category of request that a user can make
type RequestOption struct {
	Type           string       `json:"type"`
	Label          string       `json:"button_label"`
	Description    string       `json:"description"`
	CreateURL      string       `json:"create_url"`
	SignInRequired bool         `json:"sign_in_required"`
	ItemOptions    []ItemOption `json:"item_options"`
}

// ItemOption is a selectable item in a RequestOption
type ItemOption struct {
	Label    string `json:"label"`
	Barcode  string `json:"barcode"`
	SCNotes  string `json:"notes"`
	Library  string `json:"library"`
	Location string `json:"location"`
	Notice   string `json:"notice"`
}

// SolrResponse container
type SolrResponse struct {
	Response struct {
		Docs     []SolrDocument `json:"docs,omitempty"`
		NumFound int            `json:"numFound,omitempty"`
	} `json:"response,omitempty"`
}

// SolrDocument contains fields for a single solr record (borrowed from the solr pool)
type SolrDocument struct {
	AnonAvailability  []string `json:"anon_availability_a,omitempty"`
	Author            []string `json:"author_a,omitempty"`
	Barcode           string   `json:"-"`
	CallNumber        []string `json:"call_number_a,omitempty"`
	Copy              string   `json:"-"`
	Description       []string `json:"description_a,omitempty"`
	Edition           string   `json:"-"`
	HathiETAS         []string `json:"hathi_etas_f,omitempty"`
	Issue             string   `json:"-"`
	Format            []string `json:"format_a,omitempty"`
	ID                string   `json:"id,omitempty"`
	ISBN              []string `json:"isbn_a,omitempty"`
	ISSN              []string `json:"issn_a,omitempty"`
	Library           []string `json:"library_a,omitempty"`
	Location          []string `json:"location2_a,omitempty"`
	LocalNotes        []string `json:"local_notes_a,omitempty"`
	Medium            []string `json:"medium_a,omitempty"`
	PublicationDate   string   `json:"published_date,omitempty"`
	PublishedLocation []string `json:"published_location_a,omitempty"`
	PublisherName     []string `json:"publisher_name_a,omitempty"`
	SCAvailability    string   `json:"sc_availability_large_single,omitempty"`
	Title             []string `json:"title_a,omitempty"`
	URL               []string `json:"url_a,omitempty"`
	Volume            string   `json:"-"`
	WorkTypes         []string `json:"workType_a,omitempty" json:"type_of_record_a,omitempty" json:"medium_a,omitempty"`
}

// GetAvailability uses ILS Connector V4 API /availability to get details for a Document
func (svc *ServiceContext) GetAvailability(c *gin.Context) {
	titleID := c.Param("id")
	log.Printf("Getting availability for %s with ILS Connector...", titleID)

	availabilityURL := fmt.Sprintf("%s/v4/availability/%s", svc.ILSAPI, titleID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(availabilityURL, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil && ilsErr.StatusCode != 404 {
		log.Printf("ERROR: ILS Connector failure: %+v", ilsErr)
		c.String(ilsErr.StatusCode, "There was a problem retrieving availability. Please try again later.")
		return
	}

	// Convert from json
	var availResp AvailabilityData
	if err := json.Unmarshal(bodyBytes, &availResp); err != nil {
		// Non-Sirsi Item may be found in other places and have availability
		availResp = AvailabilityData{}
	}
	//log.Printf("Availability Response: %+v", availResp)
	solrDoc := svc.getSolrDoc(titleID)

	v4Claims, _ := getJWTClaims(c)
	if v4Claims.HomeLibrary == "HEALTHSCI" {
		svc.updateHSLScanOptions(titleID, &solrDoc, &availResp)
	}
	svc.appendAeonRequestOptions(titleID, solrDoc, &availResp)
	svc.removeETASRequestOptions(titleID, solrDoc, &availResp)

	c.JSON(http.StatusOK, availResp)

}
func (svc *ServiceContext) getSolrDoc(id string) SolrDocument {
	fields := solrFieldList()
	solrPath := fmt.Sprintf(`select?fl=%s,&q=id%%3A%s`, fields, id)

	respBytes, solrErr := svc.SolrGet(solrPath)
	if solrErr != nil {
		log.Printf("ERROR: Solr request for Aeon info failed: %s", solrErr.Message)
	}
	var SolrResp SolrResponse
	if err := json.Unmarshal(respBytes, &SolrResp); err != nil {
		log.Printf("ERROR: Unable to parse solr response: %s.", err.Error())
	}
	if SolrResp.Response.NumFound != 1 {
		log.Printf("ERROR: Availability - More than one record found for the cat key: %s", id)
	}
	SolrDoc := SolrResp.Response.Docs[0]
	return SolrDoc
}

func (svc *ServiceContext) updateHSLScanOptions(id string, solrDoc *SolrDocument, result *AvailabilityData) {
	log.Printf("Updating scan options for HSL user")
	// remove existing scan
	for i, opt := range result.Availability.RequestOptions {
		if opt.Type == "scan" {
			result.Availability.RequestOptions = append(
				result.Availability.RequestOptions[:i],
				result.Availability.RequestOptions[i+1:]...)
			break
		}
	}

	hsScan := RequestOption{
		Type:           "directLink",
		Label:          "Request a scan",
		SignInRequired: false,
		Description:    "Select a portion of this item to be scanned.",
		CreateURL:      openURLQuery(svc.Illiad.HealthSciURL, solrDoc),
		ItemOptions:    make([]ItemOption, 0),
	}
	result.Availability.RequestOptions = append(result.Availability.RequestOptions, hsScan)
}

func openURLQuery(baseURL string, doc *SolrDocument) string {
	var req struct {
		Action  string `url:"Action"`
		Form    string `url:"Form"`
		ISSN    string `url:"issn,omitempty"`
		Title   string `url:"loantitle"`
		Author  string `url:"loanauthor,omitempty"`
		Edition string `url:"loanedition,omitempty"`
		Volume  string `url:"photojournalvolume,omitempty"`
		Issue   string `url:"photojournalissue,omitempty"`
		Date    string `url:"loandate,omitempty"`
	}
	req.Action = "10"
	req.Form = "21"
	req.ISSN = strings.Join(doc.ISSN, ", ")
	req.Title = strings.Join(doc.Title, "; ")
	req.Author = strings.Join(doc.Author, "; ")
	req.Edition = doc.Edition
	req.Volume = doc.Volume
	req.Issue = doc.Issue
	req.Date = doc.PublicationDate
	query, err := query.Values(req)
	if err != nil {
		log.Printf("ERROR: couldn't generate OpenURL: %s", err.Error())
	}

	return fmt.Sprintf("%s/illiad.dll?%s", baseURL, query.Encode())
}

// Appends Aeon request to availability response
func (svc *ServiceContext) appendAeonRequestOptions(id string, SolrDoc SolrDocument, Result *AvailabilityData) {

	if !((SolrDoc.SCAvailability != "") || contains(SolrDoc.Library, "Special Collections")) {
		return
	}

	processSCAvailabilityStored(Result, SolrDoc)

	AeonOption := RequestOption{
		Type:           "aeon",
		Label:          "Request this in Special Collections",
		SignInRequired: false,
		Description:    "",
		CreateURL:      createAeonURL(SolrDoc),
		ItemOptions:    createAeonItemOptions(Result, SolrDoc),
	}
	//log.Printf("Aeon: %+v", AeonOption)

	Result.Availability.RequestOptions = append(Result.Availability.RequestOptions, AeonOption)

}

// processSCAvailabilityStored adds items stored in sc_availability_stored solr field to availability
func processSCAvailabilityStored(Result *AvailabilityData, doc SolrDocument) {
	// If this item has Stored SC data (ArchiveSpace)
	if doc.SCAvailability == "" {
		return
	}

	// Complete required availability fields
	Result.Availability.ID = doc.ID

	var SCItems []Item

	if err := json.Unmarshal([]byte(doc.SCAvailability), &SCItems); err != nil {
		log.Printf("Error parsing sc_availability_large_single: %+v", err)
	}
	//log.Printf("SCData: %+v", SCItems)

	// add additional item info
	//for _, item := range SCItems {
	//  item.Fields = make([]map[string]interface {}, 0)
	//}

	Result.Availability.Items = SCItems

	// TODO Add columns
	Result.Availability.Columns = []string{}
	return
}

// Creates Aeon ItemOptions based on availability data
func createAeonItemOptions(Result *AvailabilityData, doc SolrDocument) []ItemOption {

	// Sirsi Item Options
	Options := []ItemOption{}
	for _, item := range Result.Availability.Items {
		if item.LibraryID == "SPEC-COLL" || doc.SCAvailability != "" {
			notes := ""
			if len(item.SCNotes) > 0 {
				notes = item.SCNotes
			} else if len(doc.LocalNotes) > 0 {
				// drop name
				prefix1 := regexp.MustCompile(`^\s*SPECIAL\s+COLLECTIONS:\s+`)
				//shorten SC name
				prefix2 := regexp.MustCompile(`^\s*Harrison Small Special Collections,`)

				for _, note := range doc.LocalNotes {
					note = prefix1.ReplaceAllString(note, "")
					note = prefix2.ReplaceAllString(note, "H. Small,")
					// trim
					notes += (strings.TrimSpace(note) + ";\n")
				}
				// truncate
				if len(notes) > 999 {
					notes = notes[:999]
				}

			} else {
				notes = "(no location notes)"
			}

			scItem := ItemOption{
				Barcode:  item.Barcode,
				Label:    item.CallNumber,
				Location: item.HomeLocationID,
				Library:  item.Library,
				SCNotes:  notes,
				Notice:   item.Notice,
			}
			Options = append(Options, scItem)
		}
	}

	return Options
}

// Create OpenUrl for Aeon
func createAeonURL(doc SolrDocument) string {

	type aeonRequest struct {
		Action      int    `url:"Action"`
		Form        int    `url:"Form"`
		Value       string `url:"Value"` // either GenericRequestManuscript or GenericRequestMonograph
		DocID       string `url:"ReferenceNumber"`
		Title       string `url:"ItemTitle" default:"(NONE)"`
		Author      string `url:"ItemAuthor"`
		Date        string `url:"ItemDate"`
		ISxN        string `url:"ItemISxN"`
		CallNumber  string `url:"CallNumber" default:"(NONE)"`
		Barcode     string `url:"ItemNumber"`
		Place       string `url:"ItemPlace"`
		Publisher   string `url:"ItemPublisher"`
		Edition     string `url:"ItemEdition"`
		Issue       string `url:"ItemIssuesue"`
		Volume      string `url:"ItemVolume"` // unless manuscript
		Copy        string `url:"ItemInfo2"`
		Location    string `url:"Location"`
		Description string `url:"ItemInfo1"`
		Notes       string `url:"Notes"`
		Tags        string `url:"ResearcherTags,omitempty"`
		UserNote    string `url:"SpecialRequest"`
	}

	// Decide monograph or manuscript
	formValue := "GenericRequestMonograph"

	// Determine manuscript status
	// MANUSCRIPT_ITEM_TYPES = [
	//  'collection', # @see Firehose::JsonAvailability#set_holdings
	//  'manuscript'  # As seen in Sirsi holdings data.
	// ]

	if contains(doc.WorkTypes, "manuscript") ||
		contains(doc.Medium, "manuscript") ||
		contains(doc.Format, "manuscript") ||
		contains(doc.WorkTypes, "collection") {
		formValue = "GenericRequestManuscript"
	}

	//log.Printf("Solr: %+v", doc)

	// Assign values
	req := aeonRequest{
		Action:      10,
		Form:        20,
		Value:       formValue,
		DocID:       doc.ID,
		Title:       strings.Join(doc.Title, "; "),
		Date:        doc.PublicationDate,
		ISxN:        strings.Join(append(doc.ISBN, doc.ISSN...), ";"),
		Place:       strings.Join(doc.PublishedLocation, "; "),
		Publisher:   strings.Join(doc.PublisherName, "; "),
		Edition:     doc.Edition,
		Issue:       doc.Issue,
		Volume:      doc.Volume,
		Copy:        doc.Copy,
		Description: strings.Join(doc.Description, "; "),
		//Notes:       strings.Join(doc.LocalNotes, ";\r\n"),
		//Location:       doc.Location,
		//CallNumber:  doc.CallNumber,
		//Barcode:     doc.Barcode,
	}
	if len(doc.Author) == 1 {
		req.Author = doc.Author[0]
	} else if len(doc.Author) > 1 {
		req.Author = fmt.Sprintf("%s; ...", doc.Author[0])
	}

	// Notes, Bacode, CallNumber, UserNotes need to be added by client for the specific item!

	query, _ := query.Values(req)

	url := fmt.Sprintf("https://virginia.aeon.atlas-sys.com/logon?%s", query.Encode())

	return url

}

// Appends Aeon request to availability response
func (svc *ServiceContext) removeETASRequestOptions(id string, solrDoc SolrDocument, Result *AvailabilityData) {

	if len(solrDoc.HathiETAS) > 0 {
		log.Printf("ETAS FOUND. Removing request options for %s", id)
		ETASOption := RequestOption{
			Type:           "directLink",
			SignInRequired: false,
			Description:    "Currently, this item is available online as part of <a target=\"_blank\" href=\"https://news.library.virginia.edu/2020/03/31/hathitrust-provides-emergency-temporary-access-to-copyrighted-books/\">Hathi Trust Emergency Temporary Access</a> and the physical item cannot be requested.",
		}
		if len(solrDoc.URL) > 0 {
			ETASOption.CreateURL = solrDoc.URL[0]
			ETASOption.Label = "Read via HathiTrust"
		}
		// get Scan request
		ScanRequest := RequestOption{}
		for _, v := range Result.Availability.RequestOptions {
			if v.Type == "scan" {
				ScanRequest = v
			}
		}
		Result.Availability.RequestOptions = []RequestOption{ETASOption, ScanRequest}
	}
}

func contains(arr []string, str string) bool {

	matcher := regexp.MustCompile("(?i)" + str)
	for _, a := range arr {
		if matcher.MatchString(a) {
			return true
		}
	}
	return false
}

// Use json tags contained in the SolrDocument struct to create the field list for the solr query.
func solrFieldList() string {
	rv := reflect.ValueOf(SolrDocument{})
	t := rv.Type()
	matcher := regexp.MustCompile(`(\w+),`)
	var tags []string
	for i := 0; i < t.NumField(); i++ {
		value := t.Field(i).Tag.Get("json")
		matches := matcher.FindAllStringSubmatch(value, -1)
		if len(matches) > 0 && len(matches[0]) > 0 {
			tags = append(tags, matches[0][1])
		}
	}
	fields := url.QueryEscape(strings.Join(tags, ","))
	return fields
}
