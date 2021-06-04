package main

import (
	"bytes"
	"log"
	"net/http"
	"strings"
	"text/template"

	"github.com/gin-gonic/gin"
)

// SendFeedback will generate an email based on the user submission
func (svc *ServiceContext) SendFeedback(c *gin.Context) {
	log.Printf("Received feedback request")
	type FeedbackRequest struct {
		UserID        string `json:"userID"`
		Email         string `json:"email" binding:"required" `
		Name          string `json:"name,omitempty"`
		WantedTo      string `json:"wantedTo"  binding:"required"`
		Explanation   string `json:"explanation"  binding:"required"`
		URL           string `json:"url" binding:"required"`
		UserAgent     string `json:"userAgent"`
		Authenticated bool
	}

	var request FeedbackRequest
	err := c.ShouldBindJSON(&request)
	if err != nil {
		log.Printf("ERROR: Unable to parse request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	to := []string{svc.FeedbackEmail}
	if request.UserID != "anonymous" && strings.HasSuffix(request.Email, "virginia.edu") {
		to = append(to, request.Email)
		request.Authenticated = true
	} else {
		request.Authenticated = false
	}

	log.Printf("Feedback: %+v", request)

	log.Printf("Rendering feedback email body")
	var renderedEmail bytes.Buffer
	tpl := template.Must(template.New("feedback.txt").ParseFiles("templates/feedback.txt"))
	err = tpl.Execute(&renderedEmail, request)
	if err != nil {
		log.Printf("ERROR: Unable to render feedback email: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	sendErr := svc.SendEmail("Virgo 4 Feedback", to, request.Email, renderedEmail.String())
	if sendErr != nil {
		log.Printf("ERROR: Unable to send feedback email: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.String(http.StatusOK, "Feedback email sent")
}
