package main

import (
	"bufio"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
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
	ILSAPI             string
	DevAuthUser        string
	PendingTranslates  map[string]string
	DB                 *dbx.DB
	SMTP               SMTPConfig
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
		CourseReserveEmail: cfg.CourseReserveEmail,
		ILSAPI:             cfg.ILSAPI,
		SMTP:               cfg.SMTP,
		DevAuthUser:        cfg.DevAuthUser}

	log.Printf("Connect to Postgres")
	connStr := fmt.Sprintf("user=%s password=%s dbname=%s host=%s port=%d sslmode=disable",
		cfg.DB.User, cfg.DB.Pass, cfg.DB.Name, cfg.DB.Host, cfg.DB.Port)
	db, err := dbx.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	db.LogFunc = log.Printf
	ctx.DB = db

	if ctx.SMTP.DevMode {
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

	tq := svc.DB.NewQuery("select count(*) as total from sources")
	var total int
	err := tq.Row(&total)
	if err != nil {
		hcMap["postgres"] = hcResp{Healthy: false, Message: err.Error()}
	} else {
		hcMap["postgres"] = hcResp{Healthy: true}
	}

	c.JSON(http.StatusOK, hcMap)
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
	}
	acceptLang := strings.Split(c.GetHeader("Accept-Language"), ",")[0]
	log.Printf("Accept-Language=%s", acceptLang)
	cfg := config{SearchAPI: svc.SearchAPI}
	if msg, ok := svc.PendingTranslates[acceptLang]; ok {
		log.Printf("Adding translate message to config")
		cfg.TranslateMessage = msg
	}
	c.JSON(http.StatusOK, cfg)
}

// ILSConnectorGet sends a GET request to the ILS connector and returns the response
func (svc *ServiceContext) ILSConnectorGet(url string) ([]byte, *RequestError) {
	log.Printf("ILS Connector request: %s", url)
	timeout := time.Duration(20 * time.Second)
	client := http.Client{
		Timeout: timeout,
	}
	resp, err := client.Get(url)
	if err != nil {
		status := http.StatusBadRequest
		errMsg := err.Error()
		if strings.Contains(err.Error(), "Timeout") {
			status = http.StatusRequestTimeout
			errMsg = fmt.Sprintf("%s timed out", url)
		} else if strings.Contains(err.Error(), "connection refused") {
			status = http.StatusServiceUnavailable
			errMsg = fmt.Sprintf("%s refused connection", url)
		}
		log.Printf("ERROR: %s request failed: %s", url, errMsg)
		return nil, &RequestError{StatusCode: status, Message: errMsg}
	} else if resp.StatusCode != http.StatusOK {
		defer resp.Body.Close()
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		status := resp.StatusCode
		errMsg := fmt.Sprintf("ILS Connector Error: %s", string(bodyBytes))
		log.Printf("ERROR: %s request failed: %s", url, errMsg)
		return nil, &RequestError{StatusCode: status, Message: errMsg}
	}

	defer resp.Body.Close()
	bodyBytes, _ := ioutil.ReadAll(resp.Body)
	// log.Printf("Raw ILS response %s", bodyBytes)
	return bodyBytes, nil
}

// ILSConnectorPost sends a POST to the ILS connector and returns results
func (svc *ServiceContext) ILSConnectorPost(url string, values url.Values) ([]byte, *RequestError) {
	log.Printf("ILS Connector request: %s", url)
	timeout := time.Duration(20 * time.Second)
	client := http.Client{
		Timeout: timeout,
	}
	resp, err := client.PostForm(url, values)
	if err != nil {
		status := http.StatusBadRequest
		errMsg := err.Error()
		if strings.Contains(err.Error(), "Timeout") {
			status = http.StatusRequestTimeout
			errMsg = fmt.Sprintf("%s timed out", url)
		} else if strings.Contains(err.Error(), "connection refused") {
			status = http.StatusServiceUnavailable
			errMsg = fmt.Sprintf("%s refused connection", url)
		}
		log.Printf("ERROR: %s request failed: %s", url, errMsg)
		return nil, &RequestError{StatusCode: status, Message: errMsg}
	} else if resp.StatusCode != http.StatusOK {
		defer resp.Body.Close()
		bodyBytes, _ := ioutil.ReadAll(resp.Body)
		status := resp.StatusCode
		errMsg := fmt.Sprintf("ILS Connector Error: %s", string(bodyBytes))
		log.Printf("ERROR: %s request failed: %s", url, errMsg)
		return nil, &RequestError{StatusCode: status, Message: errMsg}
	}

	defer resp.Body.Close()
	bodyBytes, _ := ioutil.ReadAll(resp.Body)
	return bodyBytes, nil
}
