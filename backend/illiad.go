package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (svc *ServiceContext) illiadRegistrationRequest(c *gin.Context) {
	log.Printf("INFO: received illiad registration request")
	var req struct {
		ComputeID      string `json:"computeID"`
		FirstName      string `json:"firstName"`
		LastName       string `json:"lastName"`
		Email          string `json:"email"`
		Phone          string `json:"phone"`
		Address1       string `json:"address1"`
		Address2       string `json:"address2"`
		City           string `json:"city"`
		State          string `json:"state"`
		Zip            string `json:"zip"`
		Status         string `json:"status"`
		Department     string `json:"department"`
		School         string `json:"school"`
		DeliveryMethod string `json:"deliveryMethod"`
		Building       string `json:"buildingName"`
		Room           string `json:"roomNumber"`
		PickupLocation string `json:"pickupLocation"`
	}
	err := c.ShouldBindBodyWithJSON(&req)
	if err != nil {
		log.Printf("ERROR: invalid illiad register payload: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	log.Printf("%+v", req)

	c.String(http.StatusNotImplemented, "nope")
}

// GetILLiadRequests gets all active ILLiad requests for a user
func (svc *ServiceContext) GetILLiadRequests(c *gin.Context) {
	v4UserID := c.Param("uid")
	log.Printf("Get all active ILLiad requests for %s", v4UserID)

	orderBy := "$orderby=CreationDate+desc"
	// qStr := fmt.Sprintf("Transaction/UserRequests/%s?%s", v4UserID, orderBy)
	filter := "$filter=TransactionStatus+ne+'Request+Finished'+and+not+startswith(TransactionStatus,'Cancel')"

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
