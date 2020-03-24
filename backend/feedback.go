package main

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"strings"
	"text/template"

	"github.com/gin-gonic/gin"
)

// SendFeedback will generate an email based on the user submission
func (svc *ServiceContext) SendFeedback(c *gin.Context) {
	log.Printf("Received feedback request")
	type FeedbackRequest struct {
		UserID      string `json:"userID"`
		Email       string `json:"email" binding:"required" `
		WantedTo    string `json:"wantedTo"  binding:"required"`
		Explanation string `json:"explanation"  binding:"required"`
	}

	var request FeedbackRequest
	err := c.ShouldBindJSON(&request)
	if err != nil {
		log.Printf("ERROR: Unable to parse request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
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

	log.Printf("Generate SMTP message")
	to := []string{svc.FeedbackEmail, request.Email}
	mime := "MIME-version: 1.0;\nContent-Type: text/plain; charset=\"UTF-8\";\n\n"
	subject := "Subject: Virgo 4 Feedback\n"
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
			err = smtp.SendMail(fmt.Sprintf("%s:%d", svc.SMTP.Host, svc.SMTP.Port), auth, svc.SMTP.Sender, to, msg)
		} else {
			log.Printf("Using SendMail with no auth")
			err = smtp.SendMail(fmt.Sprintf("%s:%d", svc.SMTP.Host, svc.SMTP.Port), nil, svc.SMTP.Sender, to, msg)
		}
		if err != nil {
			log.Printf("ERROR: Unable to send reserve email: %s", err.Error())
			c.String(http.StatusInternalServerError, err.Error())
			return
		}
	}

	c.String(http.StatusOK, "Feedback email sent")

}
