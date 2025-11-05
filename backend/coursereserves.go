package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)

func (svc *ServiceContext) searchCourseReserves(c *gin.Context) {
	encodedQ := url.QueryEscape(c.Query("query"))
	url := fmt.Sprintf("%s/course_reserves/search?type=%s&query=%s", svc.ILSAPI, c.Query("type"), encodedQ)
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

	var req any
	c.ShouldBindJSON(&req)

	log.Printf("INFO: %s requests course reserves validation: %v", v4Claims.UserID, req)
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

	var req any
	c.ShouldBindJSON(&req)

	jsonReq, _ := json.Marshal(req)

	log.Printf("INFO: %s requests course reserves [ %s ]", v4Claims.UserID, jsonReq)
	url := fmt.Sprintf("%s/course_reserves", svc.ILSAPI)
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
