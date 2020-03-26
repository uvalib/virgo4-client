package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
	_ "github.com/lib/pq"
)

// ServiceContext contains common data used by all handlers
type ServiceContext struct {
	Version            string
	VirgoURL           string
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
		timeout := time.Duration(5 * time.Second)
		client := http.Client{
			Timeout: timeout,
		}
		apiURL := fmt.Sprintf("%s/version", svc.SearchAPI)
		_, err := client.Get(apiURL)
		if err != nil {
			log.Printf("ERROR: SearchAPI %s ping failed: %s", svc.SearchAPI, err.Error())
			hcMap["v4search"] = hcResp{Healthy: false, Message: err.Error()}
		} else {
			hcMap["v4search"] = hcResp{Healthy: true}
		}
	}

	if svc.ILSAPI != "" {
		timeout := time.Duration(5 * time.Second)
		client := http.Client{
			Timeout: timeout,
		}
		apiURL := fmt.Sprintf("%s/version", svc.ILSAPI)
		_, err := client.Get(apiURL)
		if err != nil {
			log.Printf("ERROR: ILS Connector %s ping failed: %s", svc.ILSAPI, err.Error())
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

	respBytes, illErr := svc.ILLiadGet("SystemInfo/SecurePlatformVersion")
	if illErr != nil {
		log.Printf("ERROR: ILLiad ping failed: %s", illErr.Message)
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

// IsAuthenticated will return success if the specified token auth token is associated with
// an authenticated user. This can be used to determine if user is UVA or not.
func (svc *ServiceContext) IsAuthenticated(c *gin.Context) {
	token := c.Param("token")
	q := svc.DB.NewQuery("select id,signed_in from users where auth_token={:t}")
	q.Bind(dbx.Params{"t": token})
	var out struct {
		UserID   string `db:"virgo4_id"`
		SignedIn bool   `db:"signed_in"`
	}
	err := q.One(&out)
	if err != nil {
		log.Printf("auth token not found. Not a UVA user. Error: %+v", err)
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}
	if out.SignedIn {
		log.Printf("auth token found and signed in. This is a UVA user")
		c.String(http.StatusOK, "%s is a UVA user", token)
	} else {
		log.Printf("auth token found, but not signed in. Not a UVA user")
		c.String(http.StatusNotFound, "%s not signed in", token)
	}
}

// GetConfig returns front-end configuration data as JSON
func (svc *ServiceContext) GetConfig(c *gin.Context) {
	type config struct {
		SearchAPI        string `json:"searchAPI"`
		TranslateMessage string `json:"translateMessage"`
		KioskMode        bool   `json:"kiosk"`
	}
	acceptLang := strings.Split(c.GetHeader("Accept-Language"), ",")[0]
	log.Printf("Accept-Language=%s", acceptLang)
	cfg := config{SearchAPI: svc.SearchAPI, KioskMode: false}
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

	c.JSON(http.StatusOK, cfg)
}

// ILLiadGet sends a GET request to ILLiad and returns the response
func (svc *ServiceContext) ILLiadGet(queryURL string) ([]byte, *RequestError) {
	illiad := fmt.Sprintf("%s/%s", svc.Illiad.URL, queryURL)
	illReq, _ := http.NewRequest("GET", illiad, nil)
	illReq.Header.Add("Content-Type", "application/json")
	illReq.Header.Add("ApiKey", svc.Illiad.APIKey)
	timeout := time.Duration(20 * time.Second)
	client := http.Client{
		Timeout: timeout,
	}
	startTime := time.Now()
	rawResp, rawErr := client.Do(illReq)
	resp, err := handleAPIResponse(illiad, rawResp, rawErr)
	elapsedNanoSec := time.Since(startTime)
	elapsedMS := int64(elapsedNanoSec / time.Millisecond)

	if err != nil {
		log.Printf("ERROR: Failed response from ILLiad GET %s - %d:%s. Elapsed Time: %d (ms)",
			queryURL, err.StatusCode, err.Message, elapsedMS)
	} else {
		log.Printf("Successful response from ILLiad GET %s. Elapsed Time: %d (ms)", queryURL, elapsedMS)
	}
	return resp, err
}

// ILSConnectorGet sends a GET request to the ILS connector and returns the response
func (svc *ServiceContext) ILSConnectorGet(url string) ([]byte, *RequestError) {
	log.Printf("ILS Connector request: %s", url)
	timeout := time.Duration(20 * time.Second)
	client := http.Client{
		Timeout: timeout,
	}
	startTime := time.Now()
	rawResp, rawErr := client.Get(url)
	resp, err := handleAPIResponse(url, rawResp, rawErr)
	elapsedNanoSec := time.Since(startTime)
	elapsedMS := int64(elapsedNanoSec / time.Millisecond)

	if err != nil {
		log.Printf("ERROR: Failed response from ILS GET %s - %d:%s. Elapsed Time: %d (ms)",
			url, err.StatusCode, err.Message, elapsedMS)
	} else {
		log.Printf("Successful response from ILS GET %s. Elapsed Time: %d (ms)", url, elapsedMS)
	}
	return resp, err
}

// ILSConnectorPost sends a POST to the ILS connector and returns results
func (svc *ServiceContext) ILSConnectorPost(url string, values interface{}) ([]byte, *RequestError) {
	log.Printf("ILS Connector request: %s", url)
	timeout := time.Duration(20 * time.Second)
	client := http.Client{
		Timeout: timeout,
	}
	startTime := time.Now()
	b, _ := json.Marshal(values)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(b))
	req.Header.Add("Content-type", "application/json")
	rawResp, rawErr := client.Do(req)
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

// SolrGet sends a GET request to solr and returns the response
func (svc *ServiceContext) SolrGet(url string) ([]byte, *RequestError) {
	log.Printf("Solr request: %s", url)
	timeout := time.Duration(5 * time.Second)
	client := http.Client{
		Timeout: timeout,
	}
	startTime := time.Now()
	rawResp, rawErr := client.Get(url)
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

func handleAPIResponse(URL string, resp *http.Response, err error) ([]byte, *RequestError) {
	if err != nil {
		status := http.StatusBadRequest
		errMsg := err.Error()
		if strings.Contains(err.Error(), "Timeout") {
			status = http.StatusRequestTimeout
			errMsg = fmt.Sprintf("%s timed out", URL)
		} else if strings.Contains(err.Error(), "connection refused") {
			status = http.StatusServiceUnavailable
			errMsg = fmt.Sprintf("%s refused connection", URL)
		}
		return nil, &RequestError{StatusCode: status, Message: errMsg}
	} else if resp.StatusCode != http.StatusOK {
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
