package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetILLiadRequests gets all active ILLiad requests for a user
func (svc *ServiceContext) GetILLiadRequests(c *gin.Context) {
	v4UserID := c.Param("uid")
	log.Printf("Get all active ILLiad requests for %s", v4UserID)

	orderBy := "$orderby=CreationDate+desc"
	// qStr := fmt.Sprintf("Transaction/UserRequests/%s?%s", v4UserID, orderBy)
	filter := "$filter=TransactionStatus+ne+'Request+Finished'+and+not+startswith(TransactionStatus,'Cancel')"
	qStr := fmt.Sprintf("Transaction/UserRequests/%s?%s&%s", v4UserID, orderBy, filter)
	respBytes, illErr := svc.ILLiadGet(qStr)
	if illErr != nil {
		log.Printf("ERROR: ILLiad request for %s failed: %s", v4UserID, illErr.Message)
		c.String(http.StatusInternalServerError, illErr.Message)
		return
	}

	var resp []struct {
		TransactionNumber int
		TransactionStatus string
		CreationDate      string
		RequestType       string
		CallNumber        string
		ReferenceNumber   string
		LoanTitle         string
		LoanAuthor        string
		WantedBy          string
		NotWantedAfter    string
	}
	if err := json.Unmarshal(respBytes, &resp); err != nil {
		log.Printf("ERROR: unable to parse ILLiad response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, resp)
}
