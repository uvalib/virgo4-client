package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"text/template"

	"github.com/gin-gonic/gin"
)

// ReserveRequest is the data POST'd by a client for course reserves
type ReserveRequest struct {
	VirgoURL string
	UserID   string         `json:"userID"`
	Request  RequestParams  `json:"request"`
	Items    []RequestItem  `json:"items"` // these are the items sent from the client
	Video    []*RequestItem `json:"-"`     // populated during processing from Items, includes avail
	NonVideo []*RequestItem `json:"-"`     // populated during processing from Items, includes avail
	MaxAvail int            `json:"-"`
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
	LMS             string `json:"lms"`
	OtherLMS        string `json:"otherLMS"`
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
	bodyBytes, ilsErr := svc.ILSConnectorPost(url, req, c.GetString("jwt"))
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
	reserveReq.Video = make([]*RequestItem, 0)
	reserveReq.NonVideo = make([]*RequestItem, 0)

	// Iterate thru all of the requested items, pull availability and stuff it into
	// an array based on type. Separate emails will go out for video / non-video
	for idx := range reserveReq.Items {
		itm := &reserveReq.Items[idx]
		itm.VirgoURL = fmt.Sprintf("%s/sources/%s/items/%s", svc.VirgoURL, itm.Pool, itm.CatalogKey)
		svc.getAvailabity(itm, c.GetString("jwt"))
		if len(itm.Availability) > reserveReq.MaxAvail {
			reserveReq.MaxAvail = len(itm.Availability)
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
		if templateFile == "reserves.txt" && len(reserveReq.NonVideo) == 0 {
			continue
		}
		if templateFile == "reserves_video.txt" && len(reserveReq.Video) == 0 {
			continue
		}
		var renderedEmail bytes.Buffer
		tpl := template.Must(template.New(templateFile).Funcs(funcs).ParseFiles(fmt.Sprintf("templates/%s", templateFile)))
		err = tpl.Execute(&renderedEmail, reserveReq)
		if err != nil {
			log.Printf("ERROR: Unable to render %s: %s", templateFile, err.Error())
			c.String(http.StatusInternalServerError, err.Error())
			return
		}

		log.Printf("Generate SMTP message for %s", templateFile)
		// NOTES for recipient: For any reserve library location other than Law, the email should be sent to
		// svc.CourseReserveEmail with the from address of the patron submitting the request.
		// For Law it should send the email to svc.LawReserveEmail AND the patron
		to := []string{}
		cc := ""
		from := svc.SMTP.Sender
		subjectName := reserveReq.Request.Name
		if reserveReq.Request.Library == "law" {
			log.Printf("The reserve library is law. Send request to law %s and requestor %s from sender %s",
				svc.LawReserveEmail, reserveReq.Request.Email, svc.SMTP.Sender)
			to = append(to, svc.LawReserveEmail)
			to = append(to, reserveReq.Request.Email)
			if reserveReq.Request.InstructorEmail != "" {
				to = append(to, reserveReq.Request.InstructorEmail)
			}
		} else {
			log.Printf("The reserve library is not law.")
			to = append(to, svc.CourseReserveEmail)
			if reserveReq.Request.InstructorEmail != "" {
				from = reserveReq.Request.InstructorEmail
				cc = reserveReq.Request.Email
				subjectName = reserveReq.Request.InstructorName
			} else {
				from = reserveReq.Request.Email
			}
		}

		subject := fmt.Sprintf("%s: %s", subjectName, reserveReq.Request.Course)
		eRequest := emailRequest{Subject: subject, To: to, CC: cc, From: from, Body: renderedEmail.String()}
		sendErr := svc.SendEmail(&eRequest)
		if sendErr != nil {
			log.Printf("ERROR: Unable to send reserve email: %s", sendErr.Error())
			c.String(http.StatusInternalServerError, sendErr.Error())
			return
		}
	}
	c.String(http.StatusOK, "Reserve emails sent")
}

func (svc *ServiceContext) getAvailabity(reqItem *RequestItem, jwt string) {
	reqItem.Availability = make([]AvailabilityInfo, 0)
	availabilityURL := fmt.Sprintf("%s/v4/availability/%s", svc.ILSAPI, reqItem.CatalogKey)
	bodyBytes, ilsErr := svc.ILSConnectorGet(availabilityURL, jwt, svc.HTTPClient)
	if ilsErr != nil {
		log.Printf("WARN: Unable to get availabilty info for reserve %s: %s", reqItem.CatalogKey, ilsErr.Message)
		return
	}

	var availData ilsAvail
	err := json.Unmarshal([]byte(bodyBytes), &availData)
	if err != nil {
		log.Printf("WARN: Invalid ILS Availabilty response for %s: %s", reqItem.CatalogKey, err.Error())
		return
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
		reqItem.Availability = append(reqItem.Availability, avail)
	}
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
	bodyBytes, ilsErr := svc.ILSConnectorGet(url, c.GetString("jwt"), svc.HTTPClient)
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
