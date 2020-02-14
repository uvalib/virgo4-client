package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"net/url"
	"strings"
	"text/template"

	"github.com/gin-gonic/gin"
)

// Desk contains about a course reserve desk
type Desk struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ReserveRequest is the data POST'd by a client for course reserves
type ReserveRequest struct {
	VirgoURL string
	UserID   string        `json:"userID"`
	Request  RequestParams `json:"request"`
	Items    []RequestItem `json:"items"`
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
	Pool         string `json:"pool"`
	CatalogKey   string `json:"catalogKey"`
	CallNumber   string `json:"callNumber"`
	Title        string `json:"title"`
	Author       string `json:"author"`
	Location     string `json:"location"`
	Library      string `json:"library"`
	Availability string `json:"availability"`
	Period       string `json:"period"`
	Notes        string `json:"notes"`
}

// ValidateCourseReserves accepts an array of catalog keys and sends them off to the
// LIS connector for validation.
func (svc *ServiceContext) ValidateCourseReserves(c *gin.Context) {
	var req struct {
		Items []string `json:"items"`
	}
	err := c.ShouldBindJSON(&req)
	if err != nil {
		log.Printf("ERROR: Unable to parse request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	log.Printf("Validate course reserve items %v", req.Items)
	url := fmt.Sprintf("%s/v4/course_reserves/validate", svc.ILSAPI)
	bodyBytes, ilsErr := svc.ILSConnectorPost(url, req)
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
	reserveReq.VirgoURL = svc.VirgoURL
	log.Printf("Request: %+v", reserveReq)

	// TODO check LDAP user info to see if user can make a reserve

	log.Printf("Rendering reserve email body")
	var renderedEmail bytes.Buffer
	funcs := template.FuncMap{"add": func(x, y int) int {
		return x + y
	}}
	tpl := template.Must(template.New("reserves.txt").Funcs(funcs).ParseFiles("templates/reserves.txt"))
	err = tpl.Execute(&renderedEmail, reserveReq)
	if err != nil {
		log.Printf("ERROR: Unable to render reserve email: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	log.Printf("Generate SMTP message")
	// Per: https://stackoverflow.com/questions/36485857/sending-emails-with-name-email-from-go
	// sending addresses like 'user name <email.com>' does not work with the default
	// mail package. Leaving at just email address for now. Can revisit after meetings
	/// about functionality.
	// toAddr := mail.Address{Name: emailMap[reserveReq.Request.Library], Address: svc.CourseReserveEmail}
	to := []string{svc.CourseReserveEmail, reserveReq.Request.Email}
	if reserveReq.Request.InstructorEmail != "" {
		to = append(to, reserveReq.Request.InstructorEmail)
	}
	mime := "MIME-version: 1.0;\nContent-Type: text/plain; charset=\"UTF-8\";\n\n"
	subject := fmt.Sprintf("Subject: %s: %s\n", reserveReq.Request.Name, reserveReq.Request.Course)
	toHdr := fmt.Sprintf("To: %s\n", strings.Join(to, ","))
	msg := []byte(subject + toHdr + mime + renderedEmail.String())

	if svc.Dev.FakeSMTP {
		log.Printf("Email is in dev mode. Logging message instead of sending")
		log.Printf("==================================================")
		log.Printf("%s", msg)
		log.Printf("==================================================")
	} else {
		log.Printf("Sending reserve email to %s", strings.Join(to, ","))
		auth := smtp.PlainAuth("", svc.SMTP.User, svc.SMTP.Pass, svc.SMTP.Host)
		err := smtp.SendMail(fmt.Sprintf("%s:%d", svc.SMTP.Host, svc.SMTP.Port), auth, svc.SMTP.Sender, to, msg)
		if err != nil {
			log.Printf("ERROR: Unable to send reserve email: %s", err.Error())
			c.String(http.StatusInternalServerError, err.Error())
			return
		}
	}

	c.String(http.StatusOK, "Reserve email sent")
}

// SearchReserves will search for reservations on the specified course.
// The course can be querried by Course ID or course/instructor NAME
func (svc *ServiceContext) SearchReserves(c *gin.Context) {
	desk := c.Query("desk")
	page := c.Query("page")
	searchType := c.Query("type")
	qStr := c.Query("query")
	log.Printf("Search for %s=%s start page=%s desk=[%s]", searchType, qStr, page, desk)
	// EX: /v4/course_reserves/search?type=COURSE_NAME&query=art
	url := fmt.Sprintf("%s/v4/course_reserves/search?type=%s&query=%s",
		svc.ILSAPI, searchType, url.QueryEscape(qStr))
	if page != "" {
		url += fmt.Sprintf("&page=%s", page)
	}
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
