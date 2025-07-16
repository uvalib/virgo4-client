package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
	"text/template"
	"time"

	"github.com/gin-gonic/gin"
)

// User contains virgo4 user data like session token, bookmarks and preferences
type User struct {
	ID              int              `json:"-"`
	Virgo4ID        string           `json:"id"`
	LockedOut       bool             `json:"-"`
	LockedOutUntil  *time.Time       `json:"-"`
	AuthStartedAt   *time.Time       `json:"-"`
	AuthTries       int              `json:"-"`
	BookmarkFolders []BookmarkFolder `json:"bookmarks"`
	Preferences     string           `json:"preferences"`
}

// ILSUserInfo contains ILS connector details for a user
type ILSUserInfo struct {
	ID            string `json:"id"`
	NoAccount     bool   `json:"noAccount"`
	CommunityUser bool   `json:"communityUser"`
	Barcode       string `json:"barcode"`
	DisplayName   string `json:"displayName"`
	Title         string `json:"title"`
	Department    string `json:"department"`
	Description   string `json:"description"`
	Profile       string `json:"profile"`
	Address       string `json:"address"`
	Email         string `json:"email"`
	Standing      string `json:"standing"`
	AmountOwed    string `json:"amountOwed"`
	HomeLibrary   string `json:"homeLibrary"`
	PrivateLDAP   string `json:"private"`
	// pass through sirsiProfile objects
	SirsiProfile     map[string]interface{} `json:"sirsiProfile"`
	SirsiUnavailable bool                   `json:"sirsiUnavailable"`
}

// AccountRequest contains data required to request a Sirsi Account
type AccountRequest struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Department string `json:"department"`
	Address1   string `json:"address1"`
	Address2   string `json:"address2"`
	City       string `json:"city"`
	State      string `json:"state"`
	Zip        string `json:"zip"`
}

// IsGraduate returns true if this user is a graduate student
func (u *ILSUserInfo) IsGraduate() bool {
	match, _ := regexp.MatchString("(?i)graduate student", u.Description)
	if match {
		return true
	}
	match, _ = regexp.MatchString("GRADUATE", u.Profile)
	return match
}

// IsUndergraduate returns true if this user is an undergraduate student
func (u *ILSUserInfo) IsUndergraduate() bool {
	match, _ := regexp.MatchString("(?i)undergraduate", u.Description)
	if match {
		return true
	}
	match, _ = regexp.MatchString("UNDERGRAD", u.Profile)
	return match
}

// IsAlumni returns true if this user is an alumni
func (u *ILSUserInfo) IsAlumni() bool {
	match, _ := regexp.MatchString("ALUMNI", u.Profile)
	return match
}

// IsFaculty returns true if this user is faculty
func (u *ILSUserInfo) IsFaculty() bool {
	match, _ := regexp.MatchString("(?i)faculty", u.Description)
	if match {
		return true
	}
	match, _ = regexp.MatchString("FACULTY", u.Profile)
	return match
}

// IsInstructor returns true if this user is an instructor
func (u *ILSUserInfo) IsInstructor() bool {
	match, _ := regexp.MatchString("(?i)instructor", u.Description)
	return match
}

// IsStaff returns true if this user is staff
func (u *ILSUserInfo) IsStaff() bool {
	match, _ := regexp.MatchString("(?i)staff", u.Description)
	if match {
		return true
	}
	match, _ = regexp.MatchString("EMPLOYEE", u.Profile)
	return match
}

// CanPlaceReserve returns true if this user can place an item on course reserve
func (u *ILSUserInfo) CanPlaceReserve() bool {
	if u.IsUndergraduate() || u.IsAlumni() {
		return false
	}
	match, _ := regexp.MatchString("(?i)(VABORROWER)|(OTHERVAFAC)", u.Profile)
	return match == false
}

// CanPurchase returns true if this user can request to purchase items
func (u *ILSUserInfo) CanPurchase() bool {
	return u.IsGraduate() || u.IsUndergraduate() || u.IsFaculty() || u.IsInstructor() || u.IsStaff()
}

// CheckoutInfo has sumary info for a checked out item
type CheckoutInfo struct {
	ID              string `json:"id"`
	Barcode         string `json:"barcode"`
	Title           string `json:"title"`
	Author          string `json:"author"`
	CallNumber      string `json:"callNumber"`
	Library         string `json:"library"`
	CurrentLocation string `json:"currentLocation"`
	DueDate         string `json:"due"`
	OverDue         bool   `json:"overdue"`
	Fee             string `json:"overdueFee"`
	Bills           []Bill `json:"bills"`
	RecallDueDate   string `json:"recallDueDate"`
	RenewDate       string `json:"renewDate"`
}

// Bill structure
type Bill struct {
	Amount string `json:"amount"`
	Label  string `json:"label"`
}

// ChangePassword takes currPassword and newPassword as params in the json POST payload and changed the password to newPassword
func (svc *ServiceContext) ChangePassword(c *gin.Context) {
	var qp struct {
		CurrPassword string `json:"currPassword"`
		NewPassword  string `json:"newPassword"`
		UserBarcode  string `json:"barcode"`
	}

	qpErr := c.ShouldBindJSON(&qp)
	if qpErr != nil {
		log.Printf("ERROR: invalid change_password payload: %v", qpErr)
		c.String(http.StatusBadRequest, "Invalid request")
		return
	}
	log.Printf("User %s is attempting to change pin...", qp.UserBarcode)
	pinURL := fmt.Sprintf("%s/users/change_password", svc.ILSAPI)
	_, ilsErr := svc.ILSConnectorPost(pinURL, qp, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		log.Printf("User %s pin change failed", qp.UserBarcode)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	c.String(http.StatusOK, "pin changed")
}

// Forgot password step 1: request a reset email which contains a reset token
func (svc *ServiceContext) requestPasswordReset(c *gin.Context) {
	var qp struct {
		UserBarcode string `json:"userBarcode"`
	}

	qpErr := c.ShouldBindJSON(&qp)
	if qpErr != nil {
		log.Printf("ERROR: invalid forgot password payload: %v", qpErr)
		c.String(http.StatusBadRequest, "Invalid request")
		return
	}
	log.Printf("User %s is attempting to change pin...", qp.UserBarcode)
	pinURL := fmt.Sprintf("%s/users/forgot_password", svc.ILSAPI)
	_, ilsErr := svc.ILSConnectorPost(pinURL, qp, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		log.Printf("User %s password reset failed", qp.UserBarcode)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	c.String(http.StatusOK, "Password reset")
}

// Forgot password step 2: use the reset token to start a new sirsi session for reset attempts
// If a reset fails for complexity reasons, the session can be reused
func (svc *ServiceContext) startResetPasswordSession(c *gin.Context) {
	var qp struct {
		ResetToken string `json:"resetPasswordToken"`
	}
	qpErr := c.ShouldBindJSON(&qp)
	if qpErr != nil {
		log.Printf("ERROR: invalid payload for start reset session: %v", qpErr)
		c.String(http.StatusBadRequest, "invalid request")
		return
	}

	log.Printf("INFO: start reset session with token %s", qp.ResetToken)
	pinURL := fmt.Sprintf("%s/users/start_reset_password_session", svc.ILSAPI)
	resp, ilsErr := svc.ILSConnectorPost(pinURL, qp, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		log.Printf("ERROR: unable to start reset session with token %s: %s", qp.ResetToken, ilsErr.Message)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	log.Printf("INFO: reset passward session started: %s", resp)
	c.String(http.StatusOK, string(resp))
}

// Forgot password step 3: reset the password using the session started in step 2
func (svc *ServiceContext) resetPassword(c *gin.Context) {
	var qp struct {
		Session string `json:"session"`
		NewPass string `json:"newPassword"`
	}

	qpErr := c.ShouldBindJSON(&qp)
	if qpErr != nil {
		log.Printf("ERROR: invalid reset_password payload: %v", qpErr)
		c.String(http.StatusBadRequest, "invalid request")
		return
	}
	log.Printf("INFO: use established session to reset password")
	pinURL := fmt.Sprintf("%s/users/reset_password", svc.ILSAPI)
	_, ilsErr := svc.ILSConnectorPost(pinURL, qp, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		log.Printf("ERROR: reset password failed: %s", ilsErr.Message)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	c.String(http.StatusOK, "Password changed")
}

// GetUserBills uses ILS Connector user billing details
func (svc *ServiceContext) GetUserBills(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Get bills for user %s with ILS Connector...", userID)
	userURL := fmt.Sprintf("%s/users/%s/bills", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		if ilsErr.StatusCode == 503 {
			c.String(503, "UVA billing information is currently unavailable. Please try again later.")
		} else {
			c.String(ilsErr.StatusCode, ilsErr.Message)
		}
		return
	}
	var bills interface{}
	if err := json.Unmarshal(bodyBytes, &bills); err != nil {
		log.Printf("ERROR: unable to parse bills response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, bills)
}

// RenewCheckouts will renew all checkouts or a specific checked out item. Return the list of
// checkouts with updated due dates
func (svc *ServiceContext) RenewCheckouts(c *gin.Context) {
	userID := c.Param("uid")
	var qp struct {
		Barcodes []string `json:"barcodes"`
	}

	qpErr := c.ShouldBindJSON(&qp)
	if qpErr != nil {
		log.Printf("ERROR: invalid renew payload: %v", qpErr)
		c.String(http.StatusBadRequest, "Invalid renew request")
		return
	}

	ilsReq := struct {
		ComputingID string   `json:"computing_id"`
		Barcodes    []string `json:"barcodes"`
	}{
		ComputingID: userID,
		Barcodes:    qp.Barcodes,
	}
	log.Printf("Renew checkouts [%s] for user %s with ILS Connector...", qp.Barcodes, userID)

	renewURL := fmt.Sprintf("%s/requests/renew", svc.ILSAPI)
	rawRespBytes, err := svc.ILSConnectorPost(renewURL, ilsReq, c.GetString("jwt"), svc.RenewHTTPClient)
	if err != nil {
		c.String(err.StatusCode, err.Message)
		return
	}

	var out any
	json.Unmarshal(rawRespBytes, &out)
	c.JSON(http.StatusOK, out)
}

// GetUserCheckouts uses ILS Connector V4 API /users to get checked out items
func (svc *ServiceContext) GetUserCheckouts(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Get checkouts for user %s with ILS Connector...", userID)
	userURL := fmt.Sprintf("%s/users/%s/checkouts", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL, c.GetString("jwt"), svc.SlowHTTPClient)
	if ilsErr != nil {
		if ilsErr.StatusCode == 503 {
			c.String(503, "UVA checkout information is currently unavailable. Please try again later.")
		} else {
			c.String(ilsErr.StatusCode, ilsErr.Message)
		}
		return
	}
	var checkouts []CheckoutInfo
	if err := json.Unmarshal(bodyBytes, &checkouts); err != nil {
		log.Printf("ERROR: unable to parse user checkouts: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, checkouts)
}

// DownloadUserCheckouts uses ILS Connector V4 API /users to get checked out items
func (svc *ServiceContext) DownloadUserCheckouts(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Get checkouts for user %s with ILS Connector...", userID)
	userURL := fmt.Sprintf("%s/users/%s/checkouts.csv", svc.ILSAPI, userID)
	bodyBytes, ilsStatus := svc.ILSConnectorGet(userURL, c.GetString("jwt"), svc.SlowHTTPClient)

	if ilsStatus != nil {
		if ilsStatus.StatusCode == 503 {
			c.String(503, "UVA checkout information is currently unavailable. Please try again later.")
		} else {
			c.String(ilsStatus.StatusCode, ilsStatus.Message)
		}
		return
	}

	c.Header("Content-Description", "File Transfer")
	fileName := fmt.Sprintf("checkouts-%s-%s.csv", c.Param("uid"), time.Now().Format("2006-01-02"))
	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Data(http.StatusOK, "text/csv", bodyBytes)

}

// GetUserHolds uses ILS Connector V4 API /users to get checked out items
func (svc *ServiceContext) GetUserHolds(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Get holds for user %s with ILS Connector...", userID)
	userURL := fmt.Sprintf("%s/users/%s/holds", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL, c.GetString("jwt"), svc.SlowHTTPClient)
	if ilsErr != nil {
		if ilsErr.StatusCode == 503 {
			c.String(503, "Request information is currently unavailable. Please try again later.")
		} else {
			c.String(ilsErr.StatusCode, ilsErr.Message)
		}
		return
	}

	// Pass through
	var holds map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &holds); err != nil {
		log.Printf("ERROR: unable to parse user holds: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, holds)
}

// GetUser uses ILS Connector API /users to get details for a user
func (svc *ServiceContext) GetUser(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Get info for user %s with ILS Connector...", userID)

	userURL := fmt.Sprintf("%s/users/%s", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	var ilsUser ILSUserInfo
	if err := json.Unmarshal(bodyBytes, &ilsUser); err != nil {
		log.Printf("ERROR: unable to parse user response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	ilsUser.ID = userID

	log.Printf("Load other user settings from v4 internal data source")
	var v4User User
	err := svc.preloadBookmarks().Where("virgo4_id = ?", userID).First(&v4User)
	if err.Error != nil {
		log.Printf("WARN: No v4 user settings found for %s: %+v, returning defaults", userID, err.Error)
		v4User = User{ID: 0, Virgo4ID: userID, Preferences: "{}"}
	}

	// Combine local V4 database user info with ILS user info and return results to client
	type fullUser struct {
		*User
		UserInfo *ILSUserInfo `json:"user"`
	}
	user := fullUser{User: &v4User, UserInfo: &ilsUser}
	c.JSON(http.StatusOK, user)
}

// RequestContactUpdate accepts update data and sends it to lib-circ@virginia.edu
func (svc *ServiceContext) RequestContactUpdate(c *gin.Context) {
	userID := c.Param("uid")
	type ContactInfo struct {
		UserID     string `json:"userID"`
		FirstName  string `json:"firstName"`
		MiddleName string `json:"middleName"`
		LastName   string `json:"lastName"`
		Address1   string `json:"address1"`
		Address2   string `json:"address2"`
		Address3   string `json:"address3"`
		City       string `json:"city"`
		State      string `json:"state"`
		Zip        string `json:"zip"`
		Phone      string `json:"phone"`
		Email      string `json:"email"`
	}
	var req struct {
		NewContact ContactInfo `json:"newContact"`
		OldContact ContactInfo `json:"oldContact"`
	}
	err := c.ShouldBindJSON(&req)
	if err != nil {
		log.Printf("ERROR: invalid contact info update request payload for %s: %s", userID, err.Error())
		c.String(http.StatusBadRequest, "Invalid account request")
		return
	}
	log.Printf("INFO: %s has requested a contact info update: %+v", userID, req)

	fmap := template.FuncMap{
		"formatDiff": func(newField string, oldField string) string {
			if newField != oldField {
				return fmt.Sprintf("\"%s\" => \"%s\"", oldField, newField)
			}
			return "No Change"
		},
	}

	var renderedEmail bytes.Buffer
	tpl := template.Must(template.New("contact_info.txt").Funcs(fmap).ParseFiles("templates/contact_info.txt"))
	err = tpl.Execute(&renderedEmail, req)
	if err != nil {
		log.Printf("ERROR: Unable to render contact info request email: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	parsedEmails := strings.Split(req.NewContact.Email, ",")
	to := []string{"lib-circ@virginia.edu", parsedEmails[0]}
	cc := ""
	if len(parsedEmails) > 1 {
		cc = strings.Join(parsedEmails[1:], ",")
	}

	eRequest := emailRequest{Subject: "Update Contact Info Request", To: to, CC: cc, ReplyTo: parsedEmails[0], From: svc.SMTP.Sender, Body: renderedEmail.String()}
	sendErr := svc.SendEmail(&eRequest)
	if sendErr != nil {
		log.Printf("ERROR: Unable to new account request email: %s", sendErr.Error())
		c.String(http.StatusInternalServerError, sendErr.Error())
		return
	}

	c.String(http.StatusOK, "ok")
}

// CreateAccountRequest accepts a user request for a new Sirsi account and sends it to lib-circ@virginia.edu
func (svc *ServiceContext) CreateAccountRequest(c *gin.Context) {
	req := AccountRequest{}
	err := c.ShouldBindJSON(&req)
	if err != nil {
		log.Printf("ERROR: invalid account request payload: %v", err)
		c.String(http.StatusBadRequest, "Invalid account request")
		return
	}
	log.Printf("User %+v is requesting a Sirsi account", req)

	log.Printf("Rendering account request email body")
	var renderedEmail bytes.Buffer
	tpl := template.Must(template.New("new_account.txt").ParseFiles("templates/new_account.txt"))
	err = tpl.Execute(&renderedEmail, req)
	if err != nil {
		log.Printf("ERROR: Unable to render account request email: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	to := []string{"lib-circ@virginia.edu"}
	if strings.HasSuffix(req.Email, "@virginia.edu") {
		to = append(to, req.Email)
	}

	eRequest := emailRequest{Subject: "New Account Request", To: to, ReplyTo: req.Email, From: svc.SMTP.Sender, Body: renderedEmail.String()}
	sendErr := svc.SendEmail(&eRequest)
	if sendErr != nil {
		log.Printf("ERROR: Unable to new account request email: %s", sendErr.Error())
		c.String(http.StatusInternalServerError, sendErr.Error())
		return
	}

	c.String(http.StatusOK, "new account request sent")
}

// TempAccount holds form data to request a temporary Sirsi account
type TempAccount struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Password  string `json:"password"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Address1  string `json:"address1"`
	Address2  string `json:"address2"`
	City      string `json:"city"`
	State     string `json:"state"`
	Zip       string `json:"zip"`
}

// CreateTempAccount accepts a user account request and creates a temporary account in Sirsi via ils-connector
func (svc *ServiceContext) CreateTempAccount(c *gin.Context) {
	req := TempAccount{}
	err := c.ShouldBindJSON(&req)
	if err != nil {
		log.Printf("ERROR: invalid temp account request payload: %v", err)
		c.String(http.StatusBadRequest, "Invalid temp account request")
		return
	}
	log.Printf("Temp User account request: %+v", req)
	createURL := fmt.Sprintf("%s/users/register", svc.ILSAPI)
	_, ilsErr := svc.ILSConnectorPost(createURL, req, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		log.Printf("ERROR: Temp account create failed for %s \n %s", req.Email, ilsErr.Message)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	log.Printf("INFO: Temp account created for %s", req.Email)
	c.String(http.StatusCreated, "Temp account created")
}

// ActivateTempAccount accepts a user account request and creates a temporary account in Sirsi via ils-connector
func (svc *ServiceContext) ActivateTempAccount(c *gin.Context) {

	token := c.Query("token")
	if token == "" {
		log.Printf("WARN: missing activation token")
		c.Redirect(http.StatusFound, "/signin?activated=false")
		return
	}

	activateURL := fmt.Sprintf("%s/users/activate/%s", svc.ILSAPI, token)
	_, ilsErr := svc.ILSConnectorGet(activateURL, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		log.Printf("WARN: Temp account activation failed")
		c.Redirect(http.StatusFound, "/signin?activated=false")
		return
	}
	log.Printf("INFO: Temp account activated")
	c.Redirect(http.StatusFound, "/signin?activated=true")
}
