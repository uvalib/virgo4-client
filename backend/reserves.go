package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)

// Desk contains about a course reserve desk
type Desk struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ReserveSearchResponse holds course and/or instructor info for
// a course reserves search / list request
type ReserveSearchResponse struct {
	UserID     string `json:"userID,omitempty"`
	UserName   string `json:"userName,omitempty"`
	CourseID   string `json:"courseID,omitempty"`
	CourseName string `json:"courseName,omitempty"`
}

// ReserveDetail contains all of the course reserve deatisl for a user/course
type ReserveDetail struct {
	ReserveSearchResponse
	Reserves []ReservedItem `json:"reserves"`
}

// ReservedItem contains courser reserve item detail
type ReservedItem struct {
	CatalogKey int    `json:"catalogKey,omitempty"`
	CallNumber string `json:"callNumber,omitempty"`
	Author     string `json:"author,omitempty"`
	Title      string `json:"title,omitempty"`
	Desk       string `json:"reserveDeskID,omitempty"`
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
		svc.ILSAPI, searchType, qStr)
	if desk != "" {
		url += fmt.Sprintf("&desk=%s", desk)
	}
	bodyBytes, ilsErr := svc.ILSConnectorGet(url)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	var resp []ReserveSearchResponse
	if err := json.Unmarshal(bodyBytes, &resp); err != nil {
		log.Printf("ERROR: unable to parse reserve search: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, resp)
}

// ListCoursesByInstructor will list all courses that have reservations by he
// specified instructor
func (svc *ServiceContext) ListCoursesByInstructor(c *gin.Context) {
	userID := c.Param("uid")
	desk := c.Query("desk")
	log.Printf("List courses for %s desk=[%s]", userID, desk)
	// EX: /v4/course_reserves/list?type=USER_NAME&id=smith
	url := fmt.Sprintf("%s/v4/course_reserves/list?type=USER_NAME&id=%s",
		svc.ILSAPI, userID)
	if desk != "" {
		url += fmt.Sprintf("&desk=%s", desk)
	}
	bodyBytes, ilsErr := svc.ILSConnectorGet(url)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	var resp struct {
		ReserveSearchResponse
		Reserves []ReserveSearchResponse `json:"courses"`
	}
	if err := json.Unmarshal(bodyBytes, &resp); err != nil {
		log.Printf("ERROR: unable to parse reserve lookup: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, resp)
}

// ListInstructorsForCourse will list all of the instructors with reservations
// for the specified course
func (svc *ServiceContext) ListInstructorsForCourse(c *gin.Context) {
	courseID := c.Param("cid")
	desk := c.Query("desk")
	log.Printf("List instructors for %s desk=[%s]", courseID, desk)
	// EX: /v4/course_reserves/list?type=COURSE_ID&id=ARTH+1500-2
	url := fmt.Sprintf("%s/v4/course_reserves/list?type=COURSE_ID&id=%s",
		svc.ILSAPI, url.QueryEscape(courseID))
	if desk != "" {
		url += fmt.Sprintf("&desk=%s", desk)
	}
	bodyBytes, ilsErr := svc.ILSConnectorGet(url)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	var resp struct {
		ReserveSearchResponse
		Reserves []ReserveSearchResponse `json:"instructors"`
	}
	if err := json.Unmarshal(bodyBytes, &resp); err != nil {
		log.Printf("ERROR: unable to parse reserve lookup: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, resp)
}

//ListReserves will list all reserves for the specified cours/instructor
func (svc *ServiceContext) ListReserves(c *gin.Context) {
	userID := c.Param("uid")
	courseID := c.Param("cid")
	desk := c.Query("desk")
	log.Printf("List reserves for %s instructor %s desk=[%s]", courseID, userID, desk)
	// EX: /v4/course_reserves/details?course=ARTH+1500-2&user=253456965
	url := fmt.Sprintf("%s/v4/course_reserves/details?user=%s&course=%s",
		svc.ILSAPI, userID, url.QueryEscape(courseID))
	if desk != "" {
		url += fmt.Sprintf("&desk=%s", desk)
	}
	bodyBytes, ilsErr := svc.ILSConnectorGet(url)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	var resp ReserveDetail
	if err := json.Unmarshal(bodyBytes, &resp); err != nil {
		log.Printf("ERROR: unable to parse reserve detail: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, resp)
}
