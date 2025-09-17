package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
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
	_ "github.com/lib/pq"
	"gopkg.in/gomail.v2"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ServiceContext contains common data used by all handlers
type ServiceContext struct {
	Version         string
	VirgoURL        string
	CitationsURL    string
	CollectionsURL  string
	ShelfBrowseURL  string
	SearchAPI       string
	FeedbackEmail   string
	ILSAPI          string
	PDAAPI          string
	CatalogPoolURL  string
	JWTKey          string
	Dev             DevConfig
	Firebase        FirebaseConfig
	GDB             *gorm.DB
	SMTP            SMTPConfig
	Illiad          IlliadConfig
	FastHTTPClient  *http.Client
	HTTPClient      *http.Client
	SlowHTTPClient  *http.Client
	RenewHTTPClient *http.Client
	DibsURL         string
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
		VirgoURL:       cfg.VirgoURL,
		SearchAPI:      cfg.SearchAPI,
		CitationsURL:   cfg.CitationsURL,
		CollectionsURL: cfg.CollectionsURL,
		ShelfBrowseURL: cfg.ShelfBrowseURL,
		JWTKey:         cfg.JWTKey,
		FeedbackEmail:  cfg.FeedbackEmail,
		ILSAPI:         cfg.ILSAPI,
		PDAAPI:         cfg.PDAAPI,
		CatalogPoolURL: cfg.CatalogPoolURL,
		SMTP:           cfg.SMTP,
		Illiad:         cfg.Illiad,
		Dev:            cfg.Dev,
		Firebase:       cfg.Firebase,
		DibsURL:        cfg.DibsURL,
	}

	log.Printf("INFO: connecting GORM to postgress...")
	connStr := fmt.Sprintf("user=%s password=%s dbname=%s host=%s port=%d",
		cfg.DB.User, cfg.DB.Pass, cfg.DB.Name, cfg.DB.Host, cfg.DB.Port)
	gdb, err := gorm.Open(postgres.Open(connStr), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}
	ctx.GDB = gdb

	if ctx.Dev.FakeSMTP {
		log.Printf("Using dev mode for SMTP; all messages will be logged instead of delivered")
	} else {
		log.Printf("Using SMTP host: %s", ctx.SMTP.Host)
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
	c.JSON(http.StatusOK, svc.determineVersion())
}

func (svc *ServiceContext) determineVersion() map[string]string {
	build := "unknown"
	// cos our CWD is the bin directory
	files, _ := filepath.Glob("../buildtag.*")
	if len(files) == 1 {
		build = strings.Replace(files[0], "../buildtag.", "", 1)
	}

	vMap := make(map[string]string)
	vMap["version"] = svc.Version
	vMap["build"] = build
	return vMap
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
	if svc.PDAAPI != "" {
		apiURL := fmt.Sprintf("%s/version", svc.PDAAPI)
		resp, err := svc.FastHTTPClient.Get(apiURL)
		if resp != nil {
			defer resp.Body.Close()
		}
		if err != nil {
			log.Printf("ERROR: Failed response from PDA Service PING: %s - %s", err.Error(), svc.PDAAPI)
			hcMap["pda"] = hcResp{Healthy: false, Message: err.Error()}
		} else {
			hcMap["pda"] = hcResp{Healthy: true}
		}
	}

	var schema struct {
		Version int  `db:"version"`
		Dirty   bool `db:"dirty"`
	}
	tq := svc.GDB.Raw("select version,dirty from schema_migrations order by version desc limit 1")
	err := tq.Scan(&schema)
	if err.Error != nil {
		hcMap["postgres"] = hcResp{Healthy: false, Message: err.Error.Error()}
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
		SearchAPI       string          `json:"searchAPI"`
		CitationsURL    string          `json:"citationsURL"`
		ColectionsURL   string          `json:"collectionsURL"`
		ShelfBrowseURL  string          `json:"shelfBrowseURL"`
		HealthSciURL    string          `json:"hsILLiadURL"`
		DibsURL         string          `json:"dibsURL"`
		KioskMode       bool            `json:"kiosk"`
		DevServer       bool            `json:"devServer"`
		Firebase        *FirebaseConfig `json:"firebase,omitempty"`
		PickupLibraries []pickupLibrary `json:"pickupLibraries"`
	}
	cfg := config{SearchAPI: svc.SearchAPI, CitationsURL: svc.CitationsURL,
		ColectionsURL:  svc.CollectionsURL,
		ShelfBrowseURL: svc.ShelfBrowseURL,
		HealthSciURL:   svc.Illiad.HealthSciURL, KioskMode: false,
		DibsURL: svc.DibsURL,
	}
	if svc.Firebase.APIKey != "" {
		cfg.Firebase = &svc.Firebase
	}

	v4HostHeader := c.Request.Header.Get("V4Host")
	log.Printf("Config request V4Host header: %s", v4HostHeader)
	if strings.Contains(v4HostHeader, "-kiosk") || svc.Dev.Kiosk {
		log.Printf("This request is from a kiosk")
		cfg.KioskMode = true
	}
	if strings.Contains(v4HostHeader, "-dev") || svc.Dev.AuthUser != "" {
		log.Printf("This request is from a dev server")
		cfg.DevServer = true
	}

	dbResp := svc.GDB.Order("name asc").Find(&cfg.PickupLibraries)
	if dbResp.Error != nil {
		log.Printf("ERROR: unable to get pickup libraries: %s", dbResp.Error.Error())
	}

	c.JSON(http.StatusOK, cfg)
}

// LogClientError accepts an error message from the client and logs it
func (svc *ServiceContext) LogClientError(c *gin.Context) {
	agent := c.Request.UserAgent()
	body, _ := io.ReadAll(c.Request.Body)
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
	userURL := fmt.Sprintf("%s/availability/list", svc.ILSAPI)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	var codes any
	if err := json.Unmarshal(bodyBytes, &codes); err != nil {
		log.Printf("ERROR: unable to parse codes response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, codes)
}

// ILLiadRequest sends a GET/PUT/POST request to ILLiad and returns results
func (svc *ServiceContext) ILLiadRequest(verb string, url string, data any) ([]byte, *RequestError) {
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
func (svc *ServiceContext) ILSConnectorPost(url string, values any, jwt string, httpClient *http.Client) ([]byte, *RequestError) {
	log.Printf("ILS Connector POST request: %s", url)
	startTime := time.Now()
	b, _ := json.Marshal(values)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(b))
	req.Header.Add("Content-type", "application/json")
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", jwt))
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

// PoolPost sends a POST to the specified pool
// Only used during RSS feed generation
func (svc *ServiceContext) PoolPost(url string, body any, jwt string) ([]byte, *RequestError) {
	log.Printf("INFO: pool post request: %s %v", url, body)
	b, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(b))
	req.Header.Add("Content-type", "application/json")
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", jwt))
	return svc.sendRequest(req)
}

// PoolGet sends a GET to the specified pool
func (svc *ServiceContext) PoolGet(url string, jwt string) ([]byte, *RequestError) {
	log.Printf("INFO: pool get request: %s", url)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", jwt))
	return svc.sendRequest(req)
}

func (svc *ServiceContext) sendRequest(req *http.Request) ([]byte, *RequestError) {
	startTime := time.Now()
	url := req.URL.String()
	rawResp, rawErr := svc.HTTPClient.Do(req)
	resp, err := handleAPIResponse(url, rawResp, rawErr)
	elapsedNanoSec := time.Since(startTime)
	elapsedMS := int64(elapsedNanoSec / time.Millisecond)

	if err != nil {
		log.Printf("ERROR: failed response from %s %s - %d:%s. Elapsed Time: %d (ms)",
			req.Method, url, err.StatusCode, err.Message, elapsedMS)
	} else {
		log.Printf("INFO: successful response from %s %s. Elapsed Time: %d (ms)", req.Method, url, elapsedMS)
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

type emailRequest struct {
	Subject string
	To      []string
	ReplyTo string
	CC      string
	From    string
	Body    string
}

// SendEmail will and send an email to the specified recipients
func (svc *ServiceContext) SendEmail(request *emailRequest) error {
	mail := gomail.NewMessage()
	mail.SetHeader("MIME-version", "1.0")
	mail.SetHeader("Content-Type", "text/plain; charset=\"UTF-8\"")
	mail.SetHeader("Subject", request.Subject)
	mail.SetHeader("To", request.To...)
	mail.SetHeader("From", request.From)
	if request.ReplyTo != "" {
		mail.SetHeader("Reply-To", request.ReplyTo)
	}
	if len(request.CC) > 0 {
		mail.SetHeader("Cc", request.CC)
	}
	mail.SetBody("text/plain", request.Body)

	if svc.Dev.FakeSMTP {
		log.Printf("Email is in dev mode. Logging message instead of sending")
		log.Printf("==================================================")
		mail.WriteTo(log.Writer())
		log.Printf("==================================================")
		return nil
	}

	log.Printf("Sending %s email to %s", request.Subject, strings.Join(request.To, ","))
	if svc.SMTP.Pass != "" {
		dialer := gomail.Dialer{Host: svc.SMTP.Host, Port: svc.SMTP.Port, Username: svc.SMTP.User, Password: svc.SMTP.Pass}
		dialer.TLSConfig = &tls.Config{InsecureSkipVerify: true}
		return dialer.DialAndSend(mail)
	}

	log.Printf("Sending email with no auth")
	dialer := gomail.Dialer{Host: svc.SMTP.Host, Port: svc.SMTP.Port}
	dialer.TLSConfig = &tls.Config{InsecureSkipVerify: true}
	return dialer.DialAndSend(mail)
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
		bodyBytes, _ := io.ReadAll(resp.Body)
		status := resp.StatusCode
		errMsg := string(bodyBytes)
		return nil, &RequestError{StatusCode: status, Message: errMsg}
	}

	defer resp.Body.Close()
	bodyBytes, _ := io.ReadAll(resp.Body)
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
