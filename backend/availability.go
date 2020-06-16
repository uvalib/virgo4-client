package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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
	CurrentLocation string                   `json:"current_location"`
	CallNumber      string                   `json:"call_number"`
	Volume          string                   `json:"volume"`
}

// RequestOption is a category of request that a user can make
type RequestOption struct {
	Type           string       `json:"type"`
	Label          string       `json:"button_label,omitempty"`
	Description    string       `json:"description,omitempty"`
	CreateURL      string       `json:"create_url,omitempty"`
	SignInRequired bool         `json:"sign_in_required,omitempty"`
	ItemOptions    []ItemOption `json:"item_options,omitempty"`
}

// ItemOption is a selectable item in a RequestOption
type ItemOption struct {
	Label   string `json:"label"`
	Barcode string `json:"barcode"`
	SCNotes string `json:"notes"`
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
	AlternateID          []string `json:"alternate_id_a,omitempty"`
	AeonAvailability     []string `json:"anon_availability_a,omitempty"`
	SCAvailabilityStored string   `json:"sc_availability_stored,omitempty"`
	Author               []string `json:"author_a,omitempty"`
	AuthorAddedEntry     []string `json:"author_added_entry_a,omitempty"`
	CallNumber           []string `json:"call_number_a,omitempty"`
	CallNumberSort       string   `json:"call_number_sort,omitempty"`
	Collection           []string `json:"collection_a,omitempty"`
	DataSource           []string `json:"data_source_a,omitempty"`
	Description          []string `json:"description_a,omitempty"`
	Feature              []string `json:"feature_a,omitempty"`
	Format               []string `json:"format_a,omitempty"`
	FullRecord           string   `json:"fullrecord,omitempty"`
	ID                   string   `json:"id,omitempty"`
	ISBN                 []string `json:"isbn_a,omitempty"`
	ISSN                 []string `json:"issn_a,omitempty"`
	Identifier           []string `json:"identifier_a,omitempty"`
	LCCN                 []string `json:"lccn_a,omitempty"`
	Language             []string `json:"language_a,omitempty"`
	Library              []string `json:"library_a,omitempty"`
	Location             []string `json:"location2_a,omitempty"`
	LocalNotes           []string `json:"local_notes_a,omitempty"`
	MSSWorkKeySort       string   `json:"mss_work_key_sort,omitempty"`
	Medium               []string `json:"medium_a,omitempty"`
	Note                 []string `json:"note_a,omitempty"`
	OCLC                 []string `json:"oclc_a,omitempty"`
	Pool                 []string `json:"pool_a,omitempty"`
	PublicationDate      string   `json:"published_date,omitempty"`
	Published            []string `json:"published_a,omitempty"`
	PublishedDisplay     []string `json:"published_display_a,omitempty"`
	PublishedLocation    []string `json:"published_location_a,omitempty"`
	PublisherName        []string `json:"publisher_name_a,omitempty"`
	Region               []string `json:"region_a,omitempty"`
	ReleaseDate          []string `json:"release_a,omitempty"`
	Series               []string `json:"title_series_a,omitempty"`
	Subject              []string `json:"subject_a,omitempty"`
	SubjectSummary       []string `json:"subject_summary_a,omitempty"`
	Subtitle             []string `json:"title_sub_a,omitempty"`
	Title                []string `json:"title_a,omitempty"`
	TitleAbbreviated     []string `json:"title_abbreviated_a,omitempty"`
	TitleAlternate       []string `json:"title_alternate_a,omitempty"`
	TitleUniform         []string `json:"title_uniform_a,omitempty"`
	UPC                  []string `json:"upc_a,omitempty"`
	URL                  []string `json:"url_a,omitempty"`
	URLLabel             []string `json:"url_label_a,omitempty"`
	UVAAvailability      []string `json:"uva_availability_a,omitempty"`
	WorkIdentifier       []string `json:"workIdentifier_a,omitempty"`
	WorkLocation         []string `json:"workLocation_a,omitempty"`
	WorkPhysicalDetails  []string `json:"workPhysicalDetails_a,omitempty"`
	WorkPrimaryAuthor    []string `json:"work_primary_author_a,omitempty"`
	WorkTypes            []string `json:"workType_a,omitempty" json:"type_of_record_a,omitempty" json:"medium_a,omitempty"`
	Barcode              string   `json:"-"`
	Edition              string   `json:"-"`
	Issue                string   `json:"-"`
	Volume               string   `json:"-"`
	Copy                 string   `json:"-"`
}

// GetAvailability uses ILS Connector V4 API /availability to get details for a Document
func (svc *ServiceContext) GetAvailability(c *gin.Context) {
	titleID := c.Param("id")
	log.Printf("Getting availability for %s with ILS Connector...", titleID)

	availabilityURL := fmt.Sprintf("%s/v4/availability/%s", svc.ILSAPI, titleID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(availabilityURL, c.GetString("jwt"))
	if ilsErr != nil && ilsErr.StatusCode != 404 {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	// Convert from json
	var AvailabilityResponse AvailabilityData
	if err := json.Unmarshal(bodyBytes, &AvailabilityResponse); err != nil {
		// Non-Sirsi Item may be found in other places and have availability
		AvailabilityResponse = AvailabilityData{}
	}
	//log.Printf("Availability Response: %+v", AvailabilityResponse)

	svc.appendAeonRequestOptions(titleID, &AvailabilityResponse)

	c.JSON(http.StatusOK, AvailabilityResponse)

}

// Appends Aeon request to availability response
func (svc *ServiceContext) appendAeonRequestOptions(id string, Result *AvailabilityData) {
	solrPath := fmt.Sprintf("select?fl=*&q=id%%3A%s", id)

	respBytes, solrErr := svc.SolrGet(solrPath)
	if solrErr != nil {
		log.Printf("ERROR: Solr request for Aeon info failed: %s", solrErr.Message)
		return
	}
	var SolrResp SolrResponse
	if err := json.Unmarshal(respBytes, &SolrResp); err != nil {
		log.Printf("ERROR: Unable to parse solr response: %s.", err.Error())
		return
	}
	if SolrResp.Response.NumFound != 1 {
		return
	}
	SolrDoc := SolrResp.Response.Docs[0]

	if !((SolrDoc.SCAvailabilityStored != "") || contains(SolrDoc.Library, "Special Collections")) {
		return
	}

	processSCAvailabilityStored(Result, SolrDoc)

	AeonOption := RequestOption{
		Type:           "aeon",
		Label:          "Request this in Special Collections",
		SignInRequired: true,
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
	if doc.SCAvailabilityStored == "" {
		return
	}

	// Complete other availability fields
	Result.Availability.ID = doc.ID

	var SCItems []Item

	if err := json.Unmarshal([]byte(doc.SCAvailabilityStored), &SCItems); err != nil {
		log.Printf("Error parsing sc_availability_stored: %+v", err)
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
		if item.Library == "Special Collections" {

			scItem := ItemOption{
				Barcode: item.Barcode,
				Label:   item.CallNumber,
				SCNotes: strings.Join(doc.LocalNotes, ";\n"),
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

	// arrays joined with newlines?

	query, _ := query.Values(req)

	url := fmt.Sprintf("https://virginia.aeon.atlas-sys.com/logon?%s", query.Encode())

	return url

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
