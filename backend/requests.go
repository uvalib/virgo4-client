package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
)

// CreateHold uses ILS Connector V4 API to create a Hold
func (svc *ServiceContext) CreateHold(c *gin.Context) {
	// HoldRequest contains data for a new Hold
	type HoldRequest struct {
		TitleID string `json:"titleId"`
		Barcode string `json:"barcode"`
	}
	var holdReq HoldRequest
	err := c.ShouldBindJSON(&holdReq)
	if err != nil {
		log.Printf("ERROR: Unable to parse request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	authToken := c.GetString("token")
	var userID string
	uq := svc.DB.NewQuery("select virgo4_id from users where auth_token={:t} and signed_in={:si}")
	uq.Bind(dbx.Params{"t": authToken})
	uq.Bind(dbx.Params{"si": true})
	uErr := uq.Row(&userID)
	if uErr != nil {
		log.Printf("Hold Request couldn't locate auth user: %s", uErr.Error())
		c.String(http.StatusNotFound, "%s not found", authToken)
		return
	}

	log.Printf("POSTing Hold to ILS connector")
	values := url.Values{}

	values.Add("title_key", holdReq.TitleID)
	values.Add("barcode", holdReq.Barcode)
	values.Add("user_id", userID)
	values.Add("pickup_library", "CLEMONS")

	createHoldURL := fmt.Sprintf("%s/v4/holds", svc.ILSAPI)
	bodyBytes, ilsErr := svc.ILSConnectorPost(createHoldURL, values)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	// Pass through without modification
	var result map[string]interface{}
	json.Unmarshal([]byte(bodyBytes), &result)
	c.JSON(http.StatusOK, result)
}
