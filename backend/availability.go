package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (svc *ServiceContext) getItemAvailability(c *gin.Context) {
	claims, _ := getJWTClaims(c)
	log.Printf("INFO: user %s requests availabilty for %s", claims.UserID, c.Param("id"))
	url := fmt.Sprintf("%s/availability/%s", svc.ILSAPI, c.Param("id"))
	resp, ilsErr := svc.ILSConnectorGet(url, c.GetString("jwt"), svc.SlowHTTPClient)
	if ilsErr != nil {
		log.Printf("ERROR: get availabilty failed: %s", ilsErr.Message)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	var out any
	json.Unmarshal(resp, &out)
	c.JSON(http.StatusOK, out)
}
