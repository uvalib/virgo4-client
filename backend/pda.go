package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func (svc *ServiceContext) getPdaReport(c *gin.Context) {
	log.Printf("INFO: get pda orders")

	page := c.Query("page")
	pdaPath := fmt.Sprintf("/orders?page=%s", page)

	rawResp, errResp := svc.pdaGet(pdaPath, c.GetString("jwt"))
	if errResp != nil {
		log.Printf("WARN: PDA Error: %s", errResp.Message)
		c.String(errResp.StatusCode, errResp.Message)
		return
	}

	var pdaResp map[string]any
	if err := json.Unmarshal([]byte(rawResp), &pdaResp); err != nil {
		log.Printf("ERROR: unable to parse PDA response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, pdaResp)
}

func (svc *ServiceContext) pdaGet(path string, jwt string) ([]byte, *RequestError) {
	url := fmt.Sprintf("%s%s", svc.PDAAPI, path)
	logURL := sanitizeURL(url)
	log.Printf("PDA GET request: %s, timeout  %.0f sec", logURL, svc.HTTPClient.Timeout.Seconds())
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", jwt))

	startTime := time.Now()
	rawResp, rawErr := svc.HTTPClient.Do(req)
	resp, err := handleAPIResponse(logURL, rawResp, rawErr)
	elapsedNanoSec := time.Since(startTime)
	elapsedMS := int64(elapsedNanoSec / time.Millisecond)

	if err != nil {
		if shouldLogAsError(err.StatusCode) {
			log.Printf("ERROR: Failed response from PDA GET %s - %d:%s. Elapsed Time: %d (ms)",
				logURL, err.StatusCode, err.Message, elapsedMS)
		} else {
			log.Printf("INFO: Response from PDA GET %s - %d:%s. Elapsed Time: %d (ms)",
				logURL, err.StatusCode, err.Message, elapsedMS)
		}
	} else {
		log.Printf("Successful response from PDA GET %s. Elapsed Time: %d (ms)", logURL, elapsedMS)
	}
	return resp, err
}
