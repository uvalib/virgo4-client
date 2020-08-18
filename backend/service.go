package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
	_ "github.com/lib/pq"
	"github.com/mitchellh/mapstructure"
)

// ServiceContext contains common data used by all handlers
type ServiceContext struct {
	Version            string
	VirgoURL           string
	CitationsURL       string
	SearchAPI          string
	CourseReserveEmail string
	LawReserveEmaiil   string
	FeedbackEmail      string
	ILSAPI             string
	JWTKey             string
	Dev                DevConfig
	PendingTranslates  map[string]string
	DB                 *dbx.DB
	SMTP               SMTPConfig
	Illiad             IlliadConfig
	Solr               SolrConfig
	FastHTTPClient     *http.Client
	HTTPClient         *http.Client
	SlowHTTPClient     *http.Client
}

// RequestError contains http status code and message for a
// failed ILS Connector request
type RequestError struct {
	StatusCode int
	Message    string
}

// InitService will initialize the service context based on the config parameters
func InitService(version string, cfg *ServiceConfig) (*ServiceContext, error) {
	ctx := ServiceContext{Version: version,
		VirgoURL:           cfg.VirgoURL,
		SearchAPI:          cfg.SearchAPI,
		CitationsURL:       cfg.CitationsURL,
		Solr:               cfg.Solr,
		JWTKey:             cfg.JWTKey,
		CourseReserveEmail: cfg.CourseReserveEmail,
		LawReserveEmaiil:   cfg.LawReserveEmaiil,
		FeedbackEmail:      cfg.FeedbackEmail,
		ILSAPI:             cfg.ILSAPI,
		SMTP:               cfg.SMTP,
		Illiad:             cfg.Illiad,
		Dev:                cfg.Dev}

	log.Printf("Connect to Postgres")
	connStr := fmt.Sprintf("user=%s password=%s dbname=%s host=%s port=%d sslmode=disable",
		cfg.DB.User, cfg.DB.Pass, cfg.DB.Name, cfg.DB.Host, cfg.DB.Port)
	db, err := dbx.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	db.LogFunc = log.Printf
	ctx.DB = db

	if ctx.Dev.FakeSMTP {
		log.Printf("Using dev mode for SMTP; all messages will be logged instead of delivered")
	} else {
		log.Printf("Using SMTP host: %s", ctx.SMTP.Host)
	}

	ctx.PendingTranslates = make(map[string]string)
	file, err := os.Open("pendingTranslate.txt")
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		bits := strings.Split(line, "=")
		log.Printf("Pending Translate:  %s", line)
		ctx.PendingTranslates[strings.TrimSpace(bits[0])] = strings.TrimSpace(bits[1])
	}

	log.Printf("Create HTTP client for external service calls")
	defaultTransport := &http.Transport{
		Dial: (&net.Dialer{
			Timeout:   5 * time.Second,
			KeepAlive: 600 * time.Second,
		}).Dial,
		TLSHandshakeTimeout: 5 * time.Second,
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 100,
	}
	ctx.HTTPClient = &http.Client{
		Transport: defaultTransport,
		Timeout:   10 * time.Second,
	}
	ctx.FastHTTPClient = &http.Client{
		Transport: defaultTransport,
		Timeout:   5 * time.Second,
	}
	ctx.SlowHTTPClient = &http.Client{
		Transport: defaultTransport,
		Timeout:   30 * time.Second,
	}

	return &ctx, nil
}

// GetVersion reports the version of the serivce
func (svc *ServiceContext) GetVersion(c *gin.Context) {
	build := "unknown"
	// cos our CWD is the bin directory
	files, _ := filepath.Glob("../buildtag.*")
	if len(files) == 1 {
		build = strings.Replace(files[0], "../buildtag.", "", 1)
	}

	vMap := make(map[string]string)
	vMap["version"] = svc.Version
	vMap["build"] = build
	c.JSON(http.StatusOK, vMap)
}

// HealthCheck reports the health of the server
func (svc *ServiceContext) HealthCheck(c *gin.Context) {
	log.Printf("Got healthcheck request")
	type hcResp struct {
		Healthy bool   `json:"healthy"`
		Message string `json:"message,omitempty"`
		Version int    `json:"version,omitempty"`
	}
	hcMap := make(map[string]hcResp)

	if svc.SearchAPI != "" {
		apiURL := fmt.Sprintf("%s/version", svc.SearchAPI)
		resp, err := svc.FastHTTPClient.Get(apiURL)
		if resp != nil {
			defer resp.Body.Close()
		}
		if err != nil {
			log.Printf("ERROR: Failed response from SearchAPI PING: %s - %s", err.Error(), svc.SearchAPI)
			hcMap["v4search"] = hcResp{Healthy: false, Message: err.Error()}
		} else {
			hcMap["v4search"] = hcResp{Healthy: true}
		}
	}

	if svc.ILSAPI != "" {
		apiURL := fmt.Sprintf("%s/version", svc.ILSAPI)
		resp, err := svc.FastHTTPClient.Get(apiURL)
		if resp != nil {
			defer resp.Body.Close()
		}
		if err != nil {
			log.Printf("ERROR: Failed response from ILS Connector PING: %s - %s", err.Error(), svc.ILSAPI)
			hcMap["ils_connector"] = hcResp{Healthy: false, Message: err.Error()}
		} else {
			hcMap["ils_connector"] = hcResp{Healthy: true}
		}
	}

	tq := svc.DB.NewQuery("select * from schema_migrations order by version desc limit 1")
	var schema struct {
		Version int  `db:"version"`
		Dirty   bool `db:"dirty"`
	}
	err := tq.One(&schema)
	if err != nil {
		hcMap["postgres"] = hcResp{Healthy: false, Message: err.Error()}
	} else {
		log.Printf("Schema info - Version: %d, Dirty: %t", schema.Version, schema.Dirty)
		if schema.Dirty {
			hcMap["postgres"] = hcResp{Healthy: false, Message: fmt.Sprintf("Schema %d is marked dirty", schema.Version)}
		} else {
			// check that the highest numbered migration matches DB version value
			latest := getLatestMigrationNumber()
			if latest > 0 && latest != schema.Version {
				hcMap["postgres"] = hcResp{Healthy: false, Message: fmt.Sprintf("Schema out of date. Reported version: %d, latest: %d", schema.Version, latest)}
			}
		}
		hcMap["postgres"] = hcResp{Healthy: true, Version: schema.Version}
	}

	respBytes, illErr := svc.ILLiadRequest("GET", "SystemInfo/SecurePlatformVersion", nil)
	if illErr != nil {
		log.Printf("ERROR: Failed response from ILLiad PING: %s", illErr.Message)
		hcMap["illiad"] = hcResp{Healthy: false, Message: illErr.Message}
	} else {
		hcMap["illiad"] = hcResp{Healthy: true}
		log.Printf("ILLiad version: %s", respBytes)
	}

	c.JSON(http.StatusOK, hcMap)
}

func getLatestMigrationNumber() int {
	// on deployed systems, the migrations can be found in ../db/*.sql (we run from ./bin)
	// on dev systems run with 'go run', they are in ./backend/db/migrations/*.sql
	// try both; if files found return the latest number. If none found, just return 0.
	tgts := []string{"../db", "./backend/db/migrations"}
	migrateDir := ""
	for _, dir := range tgts {
		_, err := os.Stat(dir)
		if err == nil {
			migrateDir = dir
			break
		}
	}

	if migrateDir == "" {
		log.Printf("WARN: DB Migration directory not found")
		return 0
	}

	files, err := ioutil.ReadDir(migrateDir)
	if err != nil {
		log.Printf("WARN: DB Migration directory unreadable: %s", err.Error())
		return 0
	}

	maxNum := -1
	maxFile := ""
	for _, f := range files {
		fname := f.Name()
		if strings.Contains(fname, "up.sql") {
			numStr := strings.Split(fname, "_")[0]
			num, _ := strconv.Atoi(numStr)
			if num > maxNum {
				maxNum = num
				maxFile = fname
			}
		}
	}

	// there are up/down files for each migration
	log.Printf("Last migration file found: %s, version: %d", maxFile, maxNum)
	return maxNum
}

// GetConfig returns front-end configuration data as JSON
func (svc *ServiceContext) GetConfig(c *gin.Context) {
	type config struct {
		SearchAPI        string `json:"searchAPI"`
		CitationsURL     string `json:"citationsURL"`
		HealthSciURL     string `json:"hsILLiadURL"`
		TranslateMessage string `json:"translateMessage"`
		KioskMode        bool   `json:"kiosk"`
		DevServer        bool   `json:"devServer"`
	}
	acceptLang := strings.Split(c.GetHeader("Accept-Language"), ",")[0]
	log.Printf("Accept-Language=%s", acceptLang)
	cfg := config{SearchAPI: svc.SearchAPI, CitationsURL: svc.CitationsURL,
		HealthSciURL: svc.Illiad.HealthSciURL, KioskMode: false}
	if msg, ok := svc.PendingTranslates[acceptLang]; ok {
		log.Printf("Adding translate message to config")
		cfg.TranslateMessage = msg
	}

	v4HostHeader := c.Request.Header.Get("V4Host")
	log.Printf("Config request V4Host header: %s", v4HostHeader)
	if strings.Index(v4HostHeader, "-kiosk") > -1 || svc.Dev.Kiosk {
		log.Printf("This request is from a kiosk")
		cfg.KioskMode = true
	}
	if strings.Index(v4HostHeader, "-dev") > -1 || svc.Dev.AuthUser != "" {
		log.Printf("This request is from a dev server")
		cfg.DevServer = true
	}

	c.JSON(http.StatusOK, cfg)
}

type solrRequestParams struct {
	Rows int      `json:"rows"`
	Fq   []string `json:"fq,omitempty"`
	Q    string   `json:"q,omitempty"`
}

type solrRequestFacet struct {
	Type  string `json:"type,omitempty"`
	Field string `json:"field,omitempty"`
	Sort  string `json:"sort,omitempty"`
	Limit int    `json:"limit,omitempty"`
}

type solrRequest struct {
	Params solrRequestParams           `json:"params"`
	Facets map[string]solrRequestFacet `json:"facet,omitempty"`
}

// GetSearchFilters will return all available advanced search filters
func (svc *ServiceContext) GetSearchFilters(c *gin.Context) {
	log.Printf("Get advanced search filters")

	type filterCfg struct {
		field string // the Solr field to facet on
		sort  string // "count" or "alpha"
		limit int    // -1 for unlimited
	}

	// advanced search filter config
	reqFilters := make(map[string]filterCfg)

	reqFilters["Collection"] = filterCfg{field: "source_f", sort: "count", limit: -1}
	//reqFilters["Series"] = filterCfg{field: "title_series_f", sort: "count", limit: 500}

	// create Solr request
	var req solrRequest

	req.Params = solrRequestParams{Q: "*:*", Rows: 0, Fq: []string{"+shadowed_location_f:VISIBLE"}}

	req.Facets = make(map[string]solrRequestFacet)
	for label, config := range reqFilters {
		req.Facets[label] = solrRequestFacet{Type: "terms", Field: config.field, Sort: config.sort, Limit: config.limit}
	}

	// send the request
	respBytes, err := svc.SolrPost("select", req)
	if err != nil {
		c.String(http.StatusInternalServerError, err.Message)
		return
	}

	// the structure of a Solr response facet
	type solrResponseFacet struct {
		Buckets []struct {
			Val string `json:"val"`
		} `json:"buckets,omitempty"`
	}

	// the Facets field will contain the facets we want, plus additional non-facet field(s).
	// we will parse the map for the facet labels we requested, as they will be the response labels.
	var solrResp struct {
		Facets map[string]interface{} `json:"facets"`
	}

	if err := json.Unmarshal(respBytes, &solrResp); err != nil {
		log.Printf("ERROR: unable to parse Solr response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	// build response
	type filter struct {
		Label  string   `json:"label"`
		Field  string   `json:"field"`
		Values []string `json:"values"`
	}

	out := make([]filter, 0)

	for label, config := range reqFilters {
		var facet solrResponseFacet

		cfg := &mapstructure.DecoderConfig{Metadata: nil, Result: &facet, TagName: "json", ZeroFields: true}
		dec, _ := mapstructure.NewDecoder(cfg)

		if mapDecErr := dec.Decode(solrResp.Facets[label]); mapDecErr != nil {
			// probably want to error handle, but for now, just drop this field
			continue
		}

		var buckets []string
		for _, bucket := range facet.Buckets {
			buckets = append(buckets, bucket.Val)
		}

		out = append(out, filter{Label: label, Field: config.field, Values: buckets})
	}

	c.JSON(http.StatusOK, out)
}

// GetCodes will return the raw library and location codes from the ILS connector
func (svc *ServiceContext) GetCodes(c *gin.Context) {
	log.Printf("Get ILS connector codes")
	userURL := fmt.Sprintf("%s/v4/availability/list", svc.ILSAPI)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	var codes interface{}
	if err := json.Unmarshal(bodyBytes, &codes); err != nil {
		log.Printf("ERROR: unable to parse codes response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, codes)
}

// ILLiadRequest sends a GET/PUT/POST request to ILLiad and returns results
func (svc *ServiceContext) ILLiadRequest(verb string, url string, data interface{}) ([]byte, *RequestError) {
	log.Printf("ILLiad  %s request: %s, %+v", verb, url, data)
	illiadURL := fmt.Sprintf("%s/%s", svc.Illiad.URL, url)

	var illReq *http.Request
	if data != nil {
		b, _ := json.Marshal(data)
		illReq, _ = http.NewRequest(verb, illiadURL, bytes.NewBuffer(b))
	} else {
		illReq, _ = http.NewRequest(verb, illiadURL, nil)
	}

	illReq.Header.Add("Content-Type", "application/json")
	illReq.Header.Add("ApiKey", svc.Illiad.APIKey)

	startTime := time.Now()
	rawResp, rawErr := svc.HTTPClient.Do(illReq)
	resp, err := handleAPIResponse(url, rawResp, rawErr)
	elapsedNanoSec := time.Since(startTime)
	elapsedMS := int64(elapsedNanoSec / time.Millisecond)

	if err != nil {
		if shouldLogAsError(err.StatusCode) {
			log.Printf("ERROR: Failed response from ILLiad %s %s - %d:%s. Elapsed Time: %d (ms)",
				verb, url, err.StatusCode, err.Message, elapsedMS)
		} else {
			log.Printf("INFO: Response from ILLiad %s %s - %d:%s. Elapsed Time: %d (ms)",
				verb, url, err.StatusCode, err.Message, elapsedMS)
		}
	} else {
		log.Printf("Successful response from ILLiad %s %s. Elapsed Time: %d (ms)", verb, url, elapsedMS)
	}
	return resp, err
}

// ILSConnectorGet sends a GET request to the ILS connector and returns the response
func (svc *ServiceContext) ILSConnectorGet(url string, jwt string, httpClient *http.Client) ([]byte, *RequestError) {

	logUrl := sanitizeUrl( url )
	log.Printf("ILS Connector GET request: %s, timeout  %.0f sec", logUrl, httpClient.Timeout.Seconds())
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", jwt))

	startTime := time.Now()
	rawResp, rawErr := httpClient.Do(req)
	resp, err := handleAPIResponse(logUrl, rawResp, rawErr)
	elapsedNanoSec := time.Since(startTime)
	elapsedMS := int64(elapsedNanoSec / time.Millisecond)

	if err != nil {
		if shouldLogAsError(err.StatusCode) {
			log.Printf("ERROR: Failed response from ILS GET %s - %d:%s. Elapsed Time: %d (ms)",
				logUrl, err.StatusCode, err.Message, elapsedMS)
		} else {
			log.Printf("INFO: Response from ILS GET %s - %d:%s. Elapsed Time: %d (ms)",
				logUrl, err.StatusCode, err.Message, elapsedMS)
		}
	} else {
		log.Printf("Successful response from ILS GET %s. Elapsed Time: %d (ms)", logUrl, elapsedMS)
	}
	return resp, err
}

// ILSConnectorPost sends a POST to the ILS connector and returns results
func (svc *ServiceContext) ILSConnectorPost(url string, values interface{}, jwt string) ([]byte, *RequestError) {
	log.Printf("ILS Connector POST request: %s", url)
	startTime := time.Now()
	b, _ := json.Marshal(values)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(b))
	req.Header.Add("Content-type", "application/json")
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", jwt))
	rawResp, rawErr := svc.HTTPClient.Do(req)
	resp, err := handleAPIResponse(url, rawResp, rawErr)
	elapsedNanoSec := time.Since(startTime)
	elapsedMS := int64(elapsedNanoSec / time.Millisecond)

	if err != nil {
		log.Printf("ERROR: Failed response from ILS POST %s - %d:%s. Elapsed Time: %d (ms)",
			url, err.StatusCode, err.Message, elapsedMS)
	} else {
		log.Printf("Successful response from ILS POST %s. Elapsed Time: %d (ms)", url, elapsedMS)
	}
	return resp, err
}

// ILSConnectorDelete sends a DELETE request to the ILS connector and returns the response
func (svc *ServiceContext) ILSConnectorDelete(url string, jwt string) ([]byte, *RequestError) {
	log.Printf("ILS Connector DELETE request: %s", url)
	req, _ := http.NewRequest("DELETE", url, nil)
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", jwt))

	startTime := time.Now()
	rawResp, rawErr := svc.HTTPClient.Do(req)
	resp, err := handleAPIResponse(url, rawResp, rawErr)
	elapsedNanoSec := time.Since(startTime)
	elapsedMS := int64(elapsedNanoSec / time.Millisecond)

	if err != nil {
		log.Printf("ERROR: Failed response from ILS DELETE %s - %d:%s. Elapsed Time: %d (ms)",
			url, err.StatusCode, err.Message, elapsedMS)
	} else {
		log.Printf("Successful response from ILS DELETE %s. Elapsed Time: %d (ms)", url, elapsedMS)
	}
	return resp, err
}

// SolrGet sends a GET request to solr and returns the response
func (svc *ServiceContext) SolrGet(query string) ([]byte, *RequestError) {
	url := fmt.Sprintf("%s/%s/%s", svc.Solr.URL, svc.Solr.Core, query)
	log.Printf("Solr GET request: %s", url)
	startTime := time.Now()
	rawResp, rawErr := svc.FastHTTPClient.Get(url)
	resp, err := handleAPIResponse(url, rawResp, rawErr)
	elapsedNanoSec := time.Since(startTime)
	elapsedMS := int64(elapsedNanoSec / time.Millisecond)

	if err != nil {
		log.Printf("ERROR: Failed response from Solr GET %s - %d:%s. Elapsed Time: %d (ms)",
			url, err.StatusCode, err.Message, elapsedMS)
	} else {
		log.Printf("Successful response from Solr GET %s. Elapsed Time: %d (ms)", url, elapsedMS)
	}
	return resp, err
}

// SolrPost sends a json POST request to solr and returns the response
func (svc *ServiceContext) SolrPost(query string, jsonReq interface{}) ([]byte, *RequestError) {
	url := fmt.Sprintf("%s/%s/%s", svc.Solr.URL, svc.Solr.Core, query)

	jsonBytes, jsonErr := json.Marshal(jsonReq)
	if jsonErr != nil {
		resp, err := handleAPIResponse(url, nil, jsonErr)
		return resp, err
	}

	req, reqErr := http.NewRequest("POST", url, bytes.NewBuffer(jsonBytes))
	if reqErr != nil {
		resp, err := handleAPIResponse(url, nil, reqErr)
		return resp, err
	}

	req.Header.Set("Content-Type", "application/json")

	log.Printf("Solr POST request: %s", url)
	startTime := time.Now()
	rawResp, rawErr := svc.FastHTTPClient.Do(req)
	resp, err := handleAPIResponse(url, rawResp, rawErr)
	elapsedNanoSec := time.Since(startTime)
	elapsedMS := int64(elapsedNanoSec / time.Millisecond)

	if err != nil {
		log.Printf("ERROR: Failed response from Solr POST %s - %d:%s. Elapsed Time: %d (ms)",
			url, err.StatusCode, err.Message, elapsedMS)
	} else {
		log.Printf("Successful response from Solr POST %s. Elapsed Time: %d (ms)", url, elapsedMS)
	}
	return resp, err
}

func handleAPIResponse(logUrl string, resp *http.Response, err error) ([]byte, *RequestError) {
	if err != nil {
		status := http.StatusBadRequest
		errMsg := err.Error()
		if strings.Contains(err.Error(), "Timeout") {
			status = http.StatusRequestTimeout
			errMsg = fmt.Sprintf("%s timed out", logUrl)
		} else if strings.Contains(err.Error(), "connection refused") {
			status = http.StatusServiceUnavailable
			errMsg = fmt.Sprintf("%s refused connection", logUrl)
		}
		return nil, &RequestError{StatusCode: status, Message: errMsg}
	} else if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		defer resp.Body.Close()
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		status := resp.StatusCode
		errMsg := string(bodyBytes)
		return nil, &RequestError{StatusCode: status, Message: errMsg}
	}

	defer resp.Body.Close()
	bodyBytes, _ := ioutil.ReadAll(resp.Body)
	return bodyBytes, nil
}

// do we log this http response as an error or is it expected under normal circumstances
func shouldLogAsError(httpStatus int) bool {
	return httpStatus != http.StatusOK && httpStatus != http.StatusNotFound
}

// sanitize a url for logging by removing the customer PIN
func sanitizeUrl( url string ) string {

	// URL contains the user PIN
	ix := strings.Index( url, "pin=" )

	// replace everything after
	if ix >= 0 {
		return url[0:ix] + "pin=SECRET"
	}

	return url
}

//
// end of file
//
