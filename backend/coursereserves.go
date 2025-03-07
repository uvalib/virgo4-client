package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (svc *ServiceContext) searchCourseReserves(c *gin.Context) {
	url := fmt.Sprintf("%s/course_reserves/search?type=%s&query=%s", svc.ILSAPI, c.Query("type"), c.Query("query"))
	resp, ilsErr := svc.ILSConnectorGet(url, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		log.Printf("ERROR: course reserves search failed: %s", ilsErr.Message)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	var out any
	json.Unmarshal(resp, &out)
	c.JSON(http.StatusOK, out)
}

func (svc *ServiceContext) validateCourseReserves(c *gin.Context) {
	v4Claims, err := getJWTClaims(c)
	if err != nil {
		log.Printf("INFO: validate course reserves claims error: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	if v4Claims.CanPlaceReserve == false {
		log.Printf("INFO: %s attemtps to validate course reserve, but cannot place reserved", v4Claims.UserID)
		c.String(http.StatusBadRequest, "you are not able to place course reserves")
		return
	}

	var req struct {
		Items []string `json:"items"`
	}
	err = c.ShouldBindJSON(&req)
	if err != nil {
		log.Printf("ERROR: Unable to parse valdate request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	log.Printf("INFO: %s requests course reserves validation for %v", v4Claims.UserID, req.Items)
	url := fmt.Sprintf("%s/course_reserves/validate", svc.ILSAPI)
	resp, ilsErr := svc.ILSConnectorPost(url, req, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		log.Printf("ERROR: validate failed: %s", ilsErr.Message)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	var out any
	json.Unmarshal(resp, &out)
	c.JSON(http.StatusOK, out)
}

func (svc *ServiceContext) createCourseReserves(c *gin.Context) {
	c.String(http.StatusNotImplemented, "not implemented")
}
