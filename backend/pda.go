package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// type pdaPageResp struct {
// 	Orders []struct {
// 		ID                int       `json:"id"`
// 		ComputingID       string    `json:"computing_id"`
// 		HoldLibrary       string    `json:"hold_library"`
// 		FundCode          string    `json:"fund_code"`
// 		LoanType          string    `json:"loan_type"`
// 		VendorOrderNumber string    `json:"vendor_order_number"`
// 		CreatedAt         time.Time `json:"created_at"`
// 		Barcode           string    `json:"barcode"`
// 		Title             string    `json:"title"`
// 	} `json:"orders"`
// 	Pagination struct {
// 		TotalPages int `json:"total_pages"`
// 	} `json:"pagination"`
// }

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

// func (svc *ServiceContext) dumpPDAData() {
// 	page := 1
// 	done := false
// 	jwt := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJsZjZmIiwiYmFyY29kZSI6Ijg1OTU2NzIzMiIsImlzVXZhIjp0cnVlLCJob21lTGlicmFyeSI6IkxFTyIsInByb2ZpbGUiOiJGQUNVTFRZIiwiY2FuUHVyY2hhc2UiOnRydWUsImNhbkxFTyI6dHJ1ZSwiY2FuTEVPUGx1cyI6ZmFsc2UsImNhblBsYWNlUmVzZXJ2ZSI6dHJ1ZSwibGVvTG9jYXRpb24iOiJMaWJyYXJ5IiwiaWxsaWFkQ2xlYXJlZCI6IlllcyIsImhhc0lsbGlhZCI6dHJ1ZSwidXNlU0lTIjpmYWxzZSwicm9sZSI6ImFkbWluIiwiYXV0aE1ldGhvZCI6Im5ldGJhZGdlIiwidmVyc2lvbiI6IjEuMi4zIiwiZXhwIjoxNzU4MDQ1MDk3LCJpc3MiOiJ2NCJ9.UE4AWX6Mse_5GuI287-l27EPrzXbYRw1M4eA1dklROg"

// 	csvF, _ := os.Create("pda_dump.csv")
// 	csvW := csv.NewWriter(csvF)
// 	defer csvF.Close()
// 	csvHead := []string{"id", "created", "ordered_by", "hold_library",
// 		"fund_code", "loan_type", "barcode", "order_number", "title"}
// 	csvW.Write(csvHead)

// 	for done == false {
// 		pdaPath := fmt.Sprintf("/orders?page=%d", page)
// 		rawResp, errResp := svc.pdaGet(pdaPath, jwt)
// 		if errResp != nil {
// 			log.Fatal(errResp.Message)
// 		}
// 		var pageResp pdaPageResp
// 		err := json.Unmarshal(rawResp, &pageResp)
// 		if err != nil {
// 			log.Fatal(err.Error())
// 		}

// 		for _, o := range pageResp.Orders {
// 			ordered := o.CreatedAt.Format("01/02/2006")
// 			row := []string{fmt.Sprintf("%d", o.ID), ordered, o.ComputingID, o.HoldLibrary,
// 				o.FundCode, o.LoanType, o.Barcode, o.VendorOrderNumber, o.Title}
// 			csvW.Write(row)
// 		}

// 		if page == pageResp.Pagination.TotalPages {
// 			done = true
// 		} else {
// 			page++
// 		}
// 	}

// 	csvW.Flush()
// }

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
