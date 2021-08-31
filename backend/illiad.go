package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// GetILLiadRequests gets all active ILLiad requests for a user
func (svc *ServiceContext) GetILLiadRequests(c *gin.Context) {
	v4UserID := c.Param("uid")
	log.Printf("Get all active ILLiad requests for %s", v4UserID)

	orderBy := "$orderby=CreationDate+desc"
	// qStr := fmt.Sprintf("Transaction/UserRequests/%s?%s", v4UserID, orderBy)
	threeYearsAgo := time.Now().AddDate(-3, 0, 0)
	filter := fmt.Sprintf("$filter=not+startswith(TransactionStatus,'Cancel')+and+TransactionDate+gt+datetime'%s'", threeYearsAgo.Format("2006-01-02"))
	qStr := fmt.Sprintf("Transaction/UserRequests/%s?%s&%s", v4UserID, orderBy, filter)
	respBytes, illErr := svc.ILLiadRequest("GET", qStr, nil)
	if illErr != nil {
		log.Printf("ERROR: ILLiad request for %s failed: %s", v4UserID, illErr.Message)
		c.String(http.StatusInternalServerError, illErr.Message)
		return
	}

	var resp []struct {
		TransactionNumber          int    `json:"transactionNumber"`
		TransactionStatus          string `json:"transactionStatus"`
		TransactionDate            string `json:"transactionDate"`
		RequestType                string `json:"requestType"`
		DocumentType               string `json:"documentType"`
		ProcessType                string `json:"processType"`
		CreationDate               string `json:"creationDate"`
		CallNumber                 string `json:"callNumber"`
		ReferenceNumber            string `json:"referenceNumber"`
		LoanTitle                  string `json:"loanTitle,omitempty"`
		LoanAuthor                 string `json:"loanAuthor,omitempty"`
		PhotoJournalTitle          string `json:"photoJournalTitle,omitempty"`
		PhotoArticleAuthor         string `json:"photoArticleAuthor,omitempty"`
		PhotoArticleTitle          string `json:"photoArticleTitle,omitempty"`
		PhotoJournalVolume         string `json:"photoJournalVolume,omitempty"`
		PhotoJournalIssue          string `json:"photoJournalIssue,omitempty"`
		PhotoJournalMonth          string `json:"photoJournalMonth,omitempty"`
		PhotoIssueYear             string `json:"photoIssueYear,omitempty"`
		PhotoJournalInclusivePages string `json:"photoJournalInclusivePages,omitempty"`
		DueDate                    string `json:"dueDate,omitempty"`
		RenewalsAllowed            bool   `json:"renewalsAllowed"`
	}
	if err := json.Unmarshal(respBytes, &resp); err != nil {
		log.Printf("ERROR: unable to parse ILLiad response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, resp)
}
