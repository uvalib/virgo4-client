package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"sort"

	"github.com/gin-gonic/gin"
)

// Desk contains about a course reserve desk
type Desk struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ReserveRequest is the data POST'd by a client for course reserves
type ReserveRequest struct {
	Request RequestParams `json:"request"`
	Items   []RequestItem `json:"items"`
}

// RequestParams contans the top-level request data for course reserves
type RequestParams struct {
	OnBehalfOf      string `json:"onBehalfOf"`
	InstructorName  string `json:"instructorName"`
	InstructorEmail string `json:"instructorEmail"`
	Name            string `json:"name"`
	Email           string `json:"email"`
	Course          string `json:"course"`
	Semester        string `json:"semester"`
	Library         string `json:"library"`
	Period          string `json:"period"`
}

// RequestItem is the details for a particular reserve item
type RequestItem struct {
	CatalogKey string `json:"catalogKey"`
	Title      string `json:"title"`
	Author     string `json:"author"`
	Period     string `json:"period"`
	Notes      string `json:"notes"`
}

// CreateCourseReserves accepts a POST to create reserves for a course. Sends emails
// to user and staff that will create the reserves
func (svc *ServiceContext) CreateCourseReserves(c *gin.Context) {
	log.Printf("Received request to create new course reserves")
	var reserveReq ReserveRequest
	err := c.ShouldBindJSON(&reserveReq)
	if err != nil {
		log.Printf("ERROR: Unable to parse request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	log.Printf("Request: %+v", reserveReq)
	c.String(http.StatusNotImplemented, "not implemented")
}

// GetReserveDesks gets a list of locations where course reserves are held
func (svc *ServiceContext) GetReserveDesks(c *gin.Context) {
	log.Printf("Get reserve desks from ILS Connector...")
	url := fmt.Sprintf("%s/v4/course_reserves/desks", svc.ILSAPI)
	bodyBytes, ilsErr := svc.ILSConnectorGet(url)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	var desks []Desk
	if err := json.Unmarshal(bodyBytes, &desks); err != nil {
		log.Printf("ERROR: unable to parse reserve desks: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	desks = append(desks, Desk{ID: "ALL", Name: "ANY"})
	sort.Slice(desks, func(i, j int) bool {
		return desks[i].Name < desks[j].Name
	})
	c.JSON(http.StatusOK, desks)
}

// SearchReserves will search for reservations on the specified course.
// The course can be querried by Course ID or course/instructor NAME
func (svc *ServiceContext) SearchReserves(c *gin.Context) {
	desk := c.Query("desk")
	searchType := c.Query("type")
	qStr := c.Query("query")
	log.Printf("Search for %s=%s desk=[%s]", searchType, qStr, desk)
	// EX: /v4/course_reserves/search?type=COURSE_NAME&query=art
	url := fmt.Sprintf("%s/v4/course_reserves/search?type=%s&query=%s",
		svc.ILSAPI, searchType, url.QueryEscape(qStr))
	if desk != "" {
		url += fmt.Sprintf("&desk=%s", desk)
	}
	bodyBytes, ilsErr := svc.ILSConnectorGet(url)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	var resp interface{}
	if err := json.Unmarshal(bodyBytes, &resp); err != nil {
		log.Printf("ERROR: unable to parse reserve search: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, resp)
}
