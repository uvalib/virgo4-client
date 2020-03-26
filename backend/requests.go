package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/uvalib/virgo4-jwt/v4jwt"
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

	claimsIface, signedIn := c.Get("claims")
	if signedIn == false {
		log.Printf("Hold Request requires signin with JWT claims; no claims found")
		c.String(http.StatusBadRequest, "signin required")
		return
	}
	claims, ok := claimsIface.(v4jwt.V4Claims)
	if ok == false {
		log.Printf("ERROR: invalid claims found")
		c.String(http.StatusBadRequest, "signin required")
		return
	}

	log.Printf("POSTing Hold to ILS connector")
	var values struct {
		TitleKey      string `json:"title_key"`
		Barcode       string `json:"barcode"`
		UserID        string `json:"user_id"`
		PickupLibrary string `json:"pickup_library"`
	}
	values.TitleKey = holdReq.TitleID
	values.Barcode = holdReq.Barcode
	values.UserID = claims.UserID
	values.PickupLibrary = "CLEMONS"

	createHoldURL := fmt.Sprintf("%s/v4/holds", svc.ILSAPI)
	bodyBytes, ilsErr := svc.ILSConnectorPost(createHoldURL, values, c.GetString("jwt"))
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	// Pass through without modification
	var result map[string]interface{}
	json.Unmarshal([]byte(bodyBytes), &result)
	c.JSON(http.StatusOK, result)
}
