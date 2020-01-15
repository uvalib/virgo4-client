package main

import (
	"bytes"
	//"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	//"net/url"
	//"sort"
	"strings"
	"text/template"

	"github.com/gin-gonic/gin"
)

func (svc *ServiceContext) SendFeedback(c *gin.Context) {
	log.Printf("Received feedback request")
	type FeedbackParams struct {
		UserID      string `json:"userID"`
		Email       string `json:"email" binding:"required" `
		WantedTo    string `json:"wantedTo"  binding:"required"`
		Explanation string `json:explanation  binding:"required"`
	}
	type FeedbackRequest struct {
		Feedback FeedbackParams `json:"feedback"`
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
	// Per: https://stackoverflow.com/questions/36485857/sending-emails-with-name-email-from-go
	// sending addresses like 'user name <email.com>' does not work with the default
	// mail package. Leaving at just email address for now. Can revisit after meetings
	/// about functionality.
	// toAddr := mail.Address{Name: emailMap[reserveReq.Request.Library], Address: svc.CourseReserveEmail}
	to := []string{svc.FeedbackEmail, request.Feedback.Email}
	mime := "MIME-version: 1.0;\nContent-Type: text/plain; charset=\"UTF-8\";\n\n"
	subject := "Virgo 4 Feedback"
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

	c.String(http.StatusOK, "Feedback email sent")

}
