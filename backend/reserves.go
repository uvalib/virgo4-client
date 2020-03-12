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

// ReserveRequest is the data POST'd by a client for course reserves
type ReserveRequest struct {
	VirgoURL string
	UserID   string        `json:"userID"`
	Request  RequestParams `json:"request"`
	Items    []RequestItem `json:"items"`
	Video    []RequestItem `json:"-"`
	NonVideo []RequestItem `json:"-"`
	MaxAvail int           `json:"-"`
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
	Pool             string             `json:"pool"`
	CatalogKey       string             `json:"catalogKey"`
	CallNumber       string             `json:"callNumber"`
	Title            string             `json:"title"`
	Author           string             `json:"author"`
	Period           string             `json:"period"`
	Notes            string             `json:"notes"`
	AudioLanguage    string             `json:"audioLanguage"`
	Subtitles        string             `json:"subtitles"`
	SubtitleLanguage string             `json:"subtitleLanguage"`
	VirgoURL         string             `json:"-"`
	Availability     []AvailabilityInfo `json:"-"`
}

// AvailabilityInfo contains item availabilty information used to generate
// the email footer
type AvailabilityInfo struct {
	Library      string `json:"library"`
	Location     string `json:"location"`
	Availability string `json:"availability"`
	CallNumber   string `json:"callNumber"`
}

type ilsAvail struct {
	Availability struct {
		Items []ilsItem `json:"items"`
	} `json:"availability"`
}

type ilsItem struct {
	Fields []field `json:"fields"`
}

type field struct {
	Name  string `json:"name"`
	Value string `json:"value"`
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
	reserveReq.MaxAvail = -1
	reserveReq.Video = make([]RequestItem, 0)
	reserveReq.NonVideo = make([]RequestItem, 0)
	for idx := range reserveReq.Items {
		itm := reserveReq.Items[idx]
		itm.VirgoURL = fmt.Sprintf("%s/%s/%s", svc.VirgoURL, itm.Pool, itm.CatalogKey)
		avail := svc.getAvailabity(reserveReq.Items[idx])
		reserveReq.Items[idx].Availability = make([]AvailabilityInfo, len(avail))
		copy(reserveReq.Items[idx].Availability, avail)
		if len(avail) > reserveReq.MaxAvail {
			reserveReq.MaxAvail = len(avail)
		}
		if itm.Pool == "video" {
			reserveReq.Video = append(reserveReq.Video, itm)
		} else {
			reserveReq.NonVideo = append(reserveReq.NonVideo, itm)
		}
	}

	funcs := template.FuncMap{"add": func(x, y int) int {
		return x + y
	}, "header": func(cnt int) string {
		out := "|#|Title|Reserve Library|Loan Period|Notes|Virgo URL|"
		for i := 0; i < cnt; i++ {
			out += fmt.Sprintf("Library%d|Location%d|Availability%d|Call Number%d|", i, i, i, i)
		}
		return out
	}, "row": func(idx int, library string, item RequestItem) string {
		out := fmt.Sprintf("|%d|%s|%s|%s|%s|%s|",
			idx+1, item.Title, library, item.Period, item.Notes, item.VirgoURL)
		availStr := ""
		for _, avail := range item.Availability {
			availStr += fmt.Sprintf("%s|%s|%s|%s|", avail.Library, avail.Location, avail.Availability, avail.CallNumber)
		}
		out += availStr
		return out
	}}
	templates := [2]string{"reserves.txt", "reserves_video.txt"}
	for _, templateFile := range templates {
		var renderedEmail bytes.Buffer
		tpl := template.Must(template.New(templateFile).Funcs(funcs).ParseFiles(fmt.Sprintf("templates/%s", templateFile)))
		err = tpl.Execute(&renderedEmail, reserveReq)
		if err != nil {
			log.Printf("ERROR: Unable to render %s: %s", templateFile, err.Error())
			c.String(http.StatusInternalServerError, err.Error())
			return
		}

		log.Printf("Generate SMTP message for %s", templateFile)
		// INFO: https://stackoverflow.com/questions/36485857/sending-emails-with-name-email-from-go
		// NOTES for recipient: For any reserve library location other than Law, the email should be sent to
		// svc.CourseReserveEmail with the from address of the patron submitting the request.
		// For Law it should send the email to svc.LawReserveEmail AND the patron
		to := []string{}
		from := svc.SMTP.Sender
		if reserveReq.Request.Library == "law" {
			log.Printf("The reserve library is law. Send request to law and requestor")
			to = append(to, svc.LawReserveEmaiil)
			to = append(to, reserveReq.Request.Email)
			if reserveReq.Request.InstructorEmail != "" {
				to = append(to, reserveReq.Request.InstructorEmail)
			}
		} else {
			log.Printf("The reserve library is not law. Send request to %s from %s",
				svc.CourseReserveEmail, reserveReq.Request.Email)
			to = append(to, svc.CourseReserveEmail)
			from = reserveReq.Request.Email
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
			var err error
			if svc.SMTP.Pass != "" {
				auth := smtp.PlainAuth("", svc.SMTP.User, svc.SMTP.Pass, svc.SMTP.Host)
				err = smtp.SendMail(fmt.Sprintf("%s:%d", svc.SMTP.Host, svc.SMTP.Port), auth, from, to, msg)
			} else {
				log.Printf("Using SendMail with no auth")
				err = smtp.SendMail(fmt.Sprintf("%s:%d", svc.SMTP.Host, svc.SMTP.Port), nil, from, to, msg)
			}
			if err != nil {
				log.Printf("ERROR: Unable to send reserve email: %s", err.Error())
				c.String(http.StatusInternalServerError, err.Error())
				return
			}
		}
	}
	c.String(http.StatusOK, "Reserve email sent")
}

func (svc *ServiceContext) getAvailabity(reqItem RequestItem) []AvailabilityInfo {
	out := make([]AvailabilityInfo, 0)
	availabilityURL := fmt.Sprintf("%s/v4/availability/%s", svc.ILSAPI, reqItem.CatalogKey)
	bodyBytes, ilsErr := svc.ILSConnectorGet(availabilityURL)
	if ilsErr != nil {
		log.Printf("WARN: Unable to get availabilty info for reserve %s: %s", reqItem.CatalogKey, ilsErr.Message)
		return out
	}

	var availData ilsAvail
	err := json.Unmarshal([]byte(bodyBytes), &availData)
	if err != nil {
		log.Printf("WARN: Invalid ILS Availabilty response for %s: %s", reqItem.CatalogKey, err.Error())
		return out
	}

	for _, availItem := range availData.Availability.Items {
		avail := AvailabilityInfo{}
		for _, field := range availItem.Fields {
			if field.Name == "Library" {
				avail.Library = field.Value
			} else if field.Name == "Availability" {
				avail.Availability = field.Value
			} else if field.Name == "Current Location" {
				avail.Location = field.Value
			} else if field.Name == "Call Number" {
				avail.CallNumber = field.Value
			}
		}
		out = append(out, avail)
	}
	return out
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
