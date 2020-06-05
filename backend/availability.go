package main

import (
  "encoding/json"
  "fmt"
  "log"
  "net/http"
  "regexp"

  "github.com/gin-gonic/gin"
  "github.com/google/go-querystring/query"
)

type AvailabilityData struct {
  ID           		string          `json:"title_id"`
  Columns    			[]string         `json:"columns,omitempty"`
  Items   				[]string        `json:"callNumber,omitempty"`
  RequestOptions  []RequestOption `json:"location,omitempty"`
}
type RequestOption struct {
  Type              string        `json:'type'`
  Label             string        `json:'label'`
  Description       string        `json:description`
  CreateURL         string        `json:create_url`
  SignInRequired    bool          `json:sign_in_required`
  ItemOptions       []ItemOption  `json:itemOptions`
}
type ItemOption struct {
  label    string  `json:label`
  barcode  string  `json:barcode`
}

type SolrResponse struct {
  Response struct {
    Docs     []SolrDocument `json:"docs,omitempty"`
    NumFound int            `json:"numFound,omitempty"`
  } `json:"response,omitempty"`
}

type SolrDocument struct {
	AlternateID         []string `json:"alternate_id_a,omitempty"`
	AnonAvailability    []string `json:"anon_availability_a,omitempty"`
	Author              []string `json:"author_facet_a,omitempty"`
	AuthorAddedEntry    []string `json:"author_added_entry_a,omitempty"`
	CallNumber          []string `json:"call_number_a,omitempty"`
	CallNumberSort      string   `json:"call_number_sort,omitempty"`
	Collection          []string `json:"collection_a,omitempty"`
	DataSource          []string `json:"data_source_a,omitempty"`
	Description         []string `json:"description_a,omitempty"`
	Feature             []string `json:"feature_a,omitempty"`
	Format              []string `json:"format_a,omitempty"`
	FullRecord          string   `json:"fullrecord,omitempty"`
	ID                  string   `json:"id,omitempty"`
	ISBN                []string `json:"isbn_a,omitempty"`
	ISSN                []string `json:"issn_a,omitempty"`
	Identifier          []string `json:"identifier_a,omitempty"`
	LCCN                []string `json:"lccn_a,omitempty"`
	Language            []string `json:"language_a,omitempty"`
	Library             []string `json:"library_a,omitempty"`
	Location            []string `json:"location2_a,omitempty"`
	LocalNotes          []string `json:"local_notes_a,omitempty"`
  MSSWorkKeySort      string   `json:"mss_work_key_sort,omitempty"`
  Medium             []string   `json:"medium_a,omitempty"`
	Note                []string `json:"note_a,omitempty"`
	OCLC                []string `json:"oclc_a,omitempty"`
	Pool                []string `json:"pool_a,omitempty"`
	PublicationDate     string   `json:"published_date,omitempty"`
	Published           []string `json:"published_a,omitempty"`
	PublishedDisplay    []string `json:"published_display_a,omitempty"`
	PublishedLocation   []string `json:"published_location_a,omitempty"`
	PublisherName       []string `json:"publisher_name_a,omitempty"`
	Region              []string `json:"region_a,omitempty"`
	ReleaseDate         []string `json:"release_a,omitempty"`
	Series              []string `json:"title_series_a,omitempty"`
	Subject             []string `json:"subject_a,omitempty"`
	SubjectSummary      []string `json:"subject_summary_a,omitempty"`
	Subtitle            []string `json:"title_sub_a,omitempty"`
	Title               []string `json:"title_a,omitempty"`
	TitleAbbreviated    []string `json:"title_abbreviated_a,omitempty"`
	TitleAlternate      []string `json:"title_alternate_a,omitempty"`
	TitleUniform        []string `json:"title_uniform_a,omitempty"`
	UPC                 []string `json:"upc_a,omitempty"`
	URL                 []string `json:"url_a,omitempty"`
	URLLabel            []string `json:"url_label_a,omitempty"`
	UVAAvailability     []string `json:"uva_availability_a,omitempty"`
	WorkIdentifier      []string `json:"workIdentifier_a,omitempty"`
	WorkLocation        []string `json:"workLocation_a,omitempty"`
	WorkPhysicalDetails []string `json:"workPhysicalDetails_a,omitempty"`
	WorkPrimaryAuthor   []string `json:"work_primary_author_a,omitempty"`
  WorkTypes           []string `json:"workType_a,omitempty" json:"type_of_record_a,omitempty" json:"medium_a,omitempty"`
  Barcode             string    `json:-`
  Edition             string    `json:-`
  Issue               string    `json:-`
  Volume              string    `json:-`
  Copy                string    `json:-`
}

// GetAvailability uses ILS Connector V4 API /availability to get details for a Document
func (svc *ServiceContext) GetAvailability(c *gin.Context) {
  titleID := c.Param("id")
  log.Printf("Getting availability for %s with ILS Connector...", titleID)

  availabilityURL := fmt.Sprintf("%s/v4/availability/%s", svc.ILSAPI, titleID)
  bodyBytes, ilsErr := svc.ILSConnectorGet(availabilityURL, c.GetString("jwt"))
  if ilsErr != nil {
    c.String(ilsErr.StatusCode, ilsErr.Message)
    return
  }

  // Convert from json
  var result map[string]interface{}
  json.Unmarshal([]byte(bodyBytes), &result)
  log.Printf("ILS Response: %+v", result)


  svc.appendAeonRequestOptions(titleID, result)


  c.JSON(http.StatusOK, result)
}

// Appends Aeon request to availability response
func (svc *ServiceContext) appendAeonRequestOptions(id string, Result map[string]interface{}) {
  url := fmt.Sprintf("%s/%s/select?q=id%%3A%s", svc.Solr.URL, svc.Solr.Core, id)
  respBytes, solrErr := svc.SolrGet(url)
  if solrErr != nil {
    log.Printf("ERROR: Solr request for Aeon info failed: %s", solrErr.Message)
    return
  }
  var SolrResp SolrResponse
  if err := json.Unmarshal(respBytes, &SolrResp); err != nil {
    log.Printf("ERROR: Unable to parse solr response: %s.", err.Error())
    return
  }

  log.Printf("Solr: %+v", SolrResp.Response)


  AeonOption := RequestOption{
    Type: "aeon",
    Label: "Request this in Special Collections",
    Description: "",
    CreateURL: CreateAeonURL(SolrResp.Response.Docs[0]),
    ItemOptions: CreateAeonItemOptions(Result, SolrResp.Response.Docs[0]),
  }
  // if multiple items are present, create itemOptions array with label and barcodes

  // TODO append the completed AeonOption to the request_options list
  Result["request_options"] = append(Result["request_options"], AeonOption)

  log.Printf("Request Options: %+v",Result["request_options"] )

}

// TODO: Item options need to be created from:
// 1) Sirsi based SC items: the item list inside the ils-connector response
// b) ArchiveSpace items: sc_availability_stored from the solr query
func CreateAeonItemOptions(Result map[string]interface{}, doc SolrDocument ) []ItemOption{
  return []ItemOption{}
}

// Create OpenUrl for Aeon
func CreateAeonURL(doc SolrDocument) string{

  type aeonRequest struct {
    Action      int      `url:Action`
    Form        int      `url:Form`
    Value       string      `url:Value` // either GenericRequestManuscript or GenericRequestMonograph
    DocID       string   `url:ReferenceNumber`
    Title       []string `url:ItemTitle default:"(NONE)"`
    Author      []string `url:ItemAuthor`
    Date        string `url:ItemDate`
    ISBN        []string `url:ItemISxN`
    ISSN        []string `url:ItemISxN`
    CallNumber  []string   `url:CallNumber default:"(NONE)"`
    Barcode     string   `url:ItemNumber`
    Place       []string   `url:ItemPlace`
    Publisher   []string   `url:ItemPublisher`
    Edition     string   `url:ItemEdition`
    Issue       string   `url:ItemIssuesue`
    Volume      string   `url:ItemVolume` // unless manuscript
    Copy        string   `url:ItemInfo2`
    Location    []string   `url:Location`
    Description []string   `url:ItemInfo1`
    Notes       []string   `url:Notes`
    Tags        []string   `url:ResearcherTags`
    UserNote    []string   `url:SpecialRequest`
  }

  // Decide monograph or manuscript
  formValue := "GenericRequestMonograph"

  if contains(doc.WorkTypes, "manuscript") {
    formValue = "GenericRequestManuscript"
  }

  // Assign values
  req := aeonRequest{
    Action: 10,
    Form: 20,
    Value: formValue,
    Title: doc.Title,
    Author: doc.Author,
    Date: doc.PublicationDate,
    ISBN: doc.ISBN,
    ISSN: doc.ISSN,
    CallNumber: doc.CallNumber,
    Barcode: doc.Barcode,
    Place: doc.PublishedLocation,
    Publisher: doc.PublisherName,
    Edition: doc.Edition,
    Issue: doc.Issue,
    Volume: doc.Volume,
    Copy: doc.Copy,
    Location: doc.LocalNotes,
    Description: doc.Description,
    Notes: doc.Location,
  }

  // Determine manuscript status
  // MANUSCRIPT_ITEM_TYPES = [
  //  'collection', # @see Firehose::JsonAvailability#set_holdings
  //  'manuscript'  # As seen in Sirsi holdings data.
  // ]

  // arrays joined with newlines?

  query, _ := query.Values(req)

  url := fmt.Sprintf("https://virginia.aeon.atlas-sys.com/logon/OpenURL?%s", query.Encode() )
  log.Print(url)

  return url

}
func contains(arr []string, str string) bool {

  matcher := regexp.MustCompile("(?i)"+str)
  for _, a := range arr {
     if matcher.MatchString(a) {
        return true
     }
  }
  return false
}
