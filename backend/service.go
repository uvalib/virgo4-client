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
	"net/smtp"
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
	AvailabilityURL    string
	VirgoURL           string
	CitationsURL       string
	CollectionsURL     string
	ShelfBrowseURL     string
	SearchAPI          string
	CourseReserveEmail string
	LawReserveEmail    string
	FeedbackEmail      string
	ILSAPI             string
	JWTKey             string
	Dev                DevConfig
	Firebase           FirebaseConfig
	PendingTranslates  map[string]string
	DB                 *dbx.DB
	SMTP               SMTPConfig
	Illiad             IlliadConfig
	FastHTTPClient     *http.Client
	HTTPClient         *http.Client
	SlowHTTPClient     *http.Client
	RenewHTTPClient    *http.Client
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
		AvailabilityURL:    cfg.AvailabilityURL,
		VirgoURL:           cfg.VirgoURL,
		SearchAPI:          cfg.SearchAPI,
		CitationsURL:       cfg.CitationsURL,
		CollectionsURL:     cfg.CollectionsURL,
		ShelfBrowseURL:     cfg.ShelfBrowseURL,
		JWTKey:             cfg.JWTKey,
		CourseReserveEmail: cfg.CourseReserveEmail,
		LawReserveEmail:    cfg.LawReserveEmail,
		FeedbackEmail:      cfg.FeedbackEmail,
		ILSAPI:             cfg.ILSAPI,
		SMTP:               cfg.SMTP,
		Illiad:             cfg.Illiad,
		Dev:                cfg.Dev,
		Firebase:           cfg.Firebase}

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
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,
			KeepAlive: 600 * time.Second,
		}).DialContext,
		ForceAttemptHTTP2:     true,
		MaxIdleConns:          100,
		MaxIdleConnsPerHost:   100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
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
	ctx.RenewHTTPClient = &http.Client{
		Transport: defaultTransport,
		Timeout:   5 * time.Minute,
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

	if svc.AvailabilityURL != "" {
		apiURL := fmt.Sprintf("%s/version", svc.AvailabilityURL)
		resp, err := svc.FastHTTPClient.Get(apiURL)
		if resp != nil {
			defer resp.Body.Close()
		}
		if err != nil {
			log.Printf("ERROR: Failed response from Availability Service PING: %s - %s", err.Error(), svc.AvailabilityURL)
			hcMap["availabilty"] = hcResp{Healthy: false, Message: err.Error()}
		} else {
			hcMap["availabilty"] = hcResp{Healthy: true}
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

	// temporary removal if alliad check... its down and not really critical for v4 to be running
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
	type mapTarget struct {
		Pool   string `json:"pool"`
		Filter string `json:"filter"`
	}
	type config struct {
		SearchAPI        string               `json:"searchAPI"`
		AvailabilityURL  string               `json:"availabilityURL"`
		CitationsURL     string               `json:"citationsURL"`
		ColectionsURL    string               `json:"collectionsURL"`
		ShelfBrowseURL   string               `json:"shelfBrowseURL"`
		HealthSciURL     string               `json:"hsILLiadURL"`
		TranslateMessage string               `json:"translateMessage"`
		KioskMode        bool                 `json:"kiosk"`
		DevServer        bool                 `json:"devServer"`
		PoolMapping      map[string]mapTarget `json:"poolMapping"`
		Firebase         *FirebaseConfig      `json:"firebase,omitempty"`
	}
	acceptLang := strings.Split(c.GetHeader("Accept-Language"), ",")[0]
	log.Printf("Accept-Language=%s", acceptLang)
	cfg := config{SearchAPI: svc.SearchAPI, CitationsURL: svc.CitationsURL,
		ColectionsURL:   svc.CollectionsURL,
		AvailabilityURL: svc.AvailabilityURL, ShelfBrowseURL: svc.ShelfBrowseURL,
		HealthSciURL: svc.Illiad.HealthSciURL, KioskMode: false}
	if msg, ok := svc.PendingTranslates[acceptLang]; ok {
		log.Printf("Adding translate message to config")
		cfg.TranslateMessage = msg
	}
	if svc.Firebase.APIKey != "" {
		cfg.Firebase = &svc.Firebase
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

	cfg.PoolMapping = make(map[string]mapTarget)
	cfg.PoolMapping["articles"] = mapTarget{Pool: "articles", Filter: "all"}
	cfg.PoolMapping["books"] = mapTarget{Pool: "uva_library", Filter: "Books"}
	cfg.PoolMapping["images"] = mapTarget{Pool: "images", Filter: "all"}
	cfg.PoolMapping["jmrl"] = mapTarget{Pool: "jmrl", Filter: "all"}
	cfg.PoolMapping["journals"] = mapTarget{Pool: "uva_library", Filter: "Journals"}
	cfg.PoolMapping["archival"] = mapTarget{Pool: "uva_library", Filter: "Manuscripts & Archival Material"}
	cfg.PoolMapping["maps"] = mapTarget{Pool: "uva_library", Filter: "Maps"}
	cfg.PoolMapping["music-recordings"] = mapTarget{Pool: "uva_library", Filter: "Music Recordings"}
	cfg.PoolMapping["musical-scores"] = mapTarget{Pool: "uva_library", Filter: "Musical Scores"}
	cfg.PoolMapping["sound-recordings"] = mapTarget{Pool: "uva_library", Filter: "Sound Recordings"}
	cfg.PoolMapping["thesis"] = mapTarget{Pool: "uva_library", Filter: "Theses"}
	cfg.PoolMapping["uva_library"] = mapTarget{Pool: "uva_library", Filter: "all"}
	cfg.PoolMapping["video"] = mapTarget{Pool: "uva_library", Filter: "Video"}
	cfg.PoolMapping["worldcat"] = mapTarget{Pool: "worldcat", Filter: "all"}

	c.JSON(http.StatusOK, cfg)
}

// LogClientError accepts an error message from the client and logs it
func (svc *ServiceContext) LogClientError(c *gin.Context) {
	agent := c.Request.UserAgent()
	body, _ := ioutil.ReadAll(c.Request.Body)
	build := "unknown"
	files, _ := filepath.Glob("../buildtag.*")
	if len(files) == 1 {
		build = strings.Replace(files[0], "../buildtag.", "", 1)
	}
	if strings.Contains(agent, "Googlebot") || strings.Contains(agent, "Applebot") {
		log.Printf("CLIENT (bot) WARN (Version %s.%s): %s", svc.Version, build, body)
	} else {
		log.Printf("CLIENT ERROR (Version %s.%s): %s", svc.Version, build, body)
	}
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

	logURL := sanitizeURL(url)
	log.Printf("ILS Connector GET request: %s, timeout  %.0f sec", logURL, httpClient.Timeout.Seconds())
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", jwt))

	startTime := time.Now()
	rawResp, rawErr := httpClient.Do(req)
	resp, err := handleAPIResponse(logURL, rawResp, rawErr)
	elapsedNanoSec := time.Since(startTime)
	elapsedMS := int64(elapsedNanoSec / time.Millisecond)

	if err != nil {
		if shouldLogAsError(err.StatusCode) {
			log.Printf("ERROR: Failed response from ILS GET %s - %d:%s. Elapsed Time: %d (ms)",
				logURL, err.StatusCode, err.Message, elapsedMS)
		} else {
			log.Printf("INFO: Response from ILS GET %s - %d:%s. Elapsed Time: %d (ms)",
				logURL, err.StatusCode, err.Message, elapsedMS)
		}
	} else {
		log.Printf("Successful response from ILS GET %s. Elapsed Time: %d (ms)", logURL, elapsedMS)
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
	httpClient := svc.HTTPClient
	if strings.Index(url, "/renewAll") > -1 {
		log.Printf("User renewAll request detected. Increase timeout to 30 seconds")
		httpClient = svc.RenewHTTPClient
	}
	rawResp, rawErr := httpClient.Do(req)
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

// SendEmail will and send an email to the specified recipients
func (svc *ServiceContext) SendEmail(subjectStr string, to []string, replyTo string, emailBody string) error {
	mime := "MIME-version: 1.0;\nContent-Type: text/plain; charset=\"UTF-8\";\n\n"
	subject := fmt.Sprintf("Subject: %s\n", subjectStr)
	toHdr := fmt.Sprintf("To: %s\n", strings.Join(to, ","))
	replyToHdr := ""
	if replyTo != "" {
		replyToHdr = fmt.Sprintf("Reply-To: %s\n", replyTo)
	}
	msg := []byte(subject + toHdr + replyToHdr + mime + emailBody)

	if svc.Dev.FakeSMTP {
		log.Printf("Email is in dev mode. Logging message instead of sending")
		log.Printf("==================================================")
		log.Printf("%s", msg)
		log.Printf("==================================================")
		return nil
	}

	log.Printf("Sending %s email to %s", subjectStr, strings.Join(to, ","))
	if svc.SMTP.Pass != "" {
		auth := smtp.PlainAuth("", svc.SMTP.User, svc.SMTP.Pass, svc.SMTP.Host)
		return smtp.SendMail(fmt.Sprintf("%s:%d", svc.SMTP.Host, svc.SMTP.Port), auth, svc.SMTP.Sender, to, msg)
	}

	log.Printf("Using SendMail with no auth")
	return smtp.SendMail(fmt.Sprintf("%s:%d", svc.SMTP.Host, svc.SMTP.Port), nil, svc.SMTP.Sender, to, msg)
}

func handleAPIResponse(logURL string, resp *http.Response, err error) ([]byte, *RequestError) {
	if err != nil {
		status := http.StatusBadRequest
		errMsg := err.Error()
		if strings.Contains(err.Error(), "Timeout") {
			status = http.StatusRequestTimeout
			errMsg = fmt.Sprintf("%s timed out", logURL)
		} else if strings.Contains(err.Error(), "connection refused") {
			status = http.StatusServiceUnavailable
			errMsg = fmt.Sprintf("%s refused connection", logURL)
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
func sanitizeURL(url string) string {

	// URL contains the user PIN
	ix := strings.Index(url, "pin=")

	// replace everything after
	if ix >= 0 {
		return url[0:ix] + "pin=SECRET"
	}

	return url
}

//
// end of file
//
