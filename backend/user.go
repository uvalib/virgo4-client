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

// ChangePin takes current_pin and new_pin as params in the json POST payload.
// It changes the pin to new_pin.
func (svc *ServiceContext) ChangePin(c *gin.Context) {
	var qp struct {
		CurrPin     string `json:"current_pin"`
		NewPin      string `json:"new_pin"`
		UserBarcode string `json:"barcode"`
	}

	qpErr := c.ShouldBindJSON(&qp)
	if qpErr != nil {
		log.Printf("ERROR: invalid change_pin payload: %v", qpErr)
		c.String(http.StatusBadRequest, "Invalid request")
		return
	}
	log.Printf("User %s is attempting to change pin...", qp.UserBarcode)
	pinURL := fmt.Sprintf("%s/v4/users/%s/change_pin", svc.ILSAPI, qp.UserBarcode)
	_, ilsErr := svc.ILSConnectorPost(pinURL, qp, c.GetString("jwt"))
	if ilsErr != nil {
		log.Printf("User %s pin change failed", qp.UserBarcode)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	c.String(http.StatusOK, "pin changed")
}

// ChangePasswordWithToken takes a resetPinToken and newPin as params in the json POST payload.
// It changes the pin to new_pin.
func (svc *ServiceContext) ChangePasswordWithToken(c *gin.Context) {
	var qp struct {
		Token   string `json:"reset_password_token"`
		NewPass string `json:"new_password"`
	}

	qpErr := c.ShouldBindJSON(&qp)
	if qpErr != nil {
		log.Printf("ERROR: invalid change_pin payload: %v", qpErr)
		c.String(http.StatusBadRequest, "Invalid request")
		return
	}
	log.Printf("Attempting to change pin with token")
	pinURL := fmt.Sprintf("%s/v4/users/change_password_with_token", svc.ILSAPI)
	_, ilsErr := svc.ILSConnectorPost(pinURL, qp, c.GetString("jwt"))
	if ilsErr != nil {
		log.Printf("User pin change with token failed")
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	c.String(http.StatusOK, "Password changed")
}

// ForgotPassword sends a password reset email via ILS Connector and Sirsi
func (svc *ServiceContext) ForgotPassword(c *gin.Context) {
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
	pinURL := fmt.Sprintf("%s/v4/users/forgot_password", svc.ILSAPI)
	_, ilsErr := svc.ILSConnectorPost(pinURL, qp, c.GetString("jwt"))
	if ilsErr != nil {
		log.Printf("User %s password reset failed", qp.UserBarcode)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	c.String(http.StatusOK, "Password reset")
}

// GetUserBills uses ILS Connector user billing details
func (svc *ServiceContext) GetUserBills(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Get bills for user %s with ILS Connector...", userID)
	userURL := fmt.Sprintf("%s/v4/users/%s/bills", svc.ILSAPI, userID)
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
		Barcode string `json:"item_barcode"`
	}

	qpErr := c.ShouldBindJSON(&qp)
	if qpErr != nil {
		log.Printf("ERROR: invalid renew payload: %v", qpErr)
		c.String(http.StatusBadRequest, "Invalid renew request")
		return
	}

	var ilsReq struct {
		ComputingID string `json:"computing_id"`
		Barcode     string `json:"item_barcode"`
	}
	log.Printf("Renew checkouts [%s] for user %s with ILS Connector...", qp.Barcode, userID)
	renewURL := fmt.Sprintf("%s/v4/request/renewAll", svc.ILSAPI)
	ilsReq.ComputingID = userID
	ilsReq.Barcode = qp.Barcode
	if qp.Barcode != "all" {
		renewURL = fmt.Sprintf("%s/v4/request/renew", svc.ILSAPI)
	}
	rawRespBytes, err := svc.ILSConnectorPost(renewURL, ilsReq, c.GetString("jwt"))
	if err != nil {
		c.String(err.StatusCode, err.Message)
		return
	}

	// Get all of the user checkouts after the renew so dates/status are updated
	userURL := fmt.Sprintf("%s/v4/users/%s/checkouts", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL, c.GetString("jwt"), svc.SlowHTTPClient)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	var checkouts []CheckoutInfo
	if err := json.Unmarshal(bodyBytes, &checkouts); err != nil {
		log.Printf("ERROR: unable to parse user checkouts: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	type outStruct struct {
		Checkouts    []CheckoutInfo `json:"checkouts"`
		RenewResults interface{}    `json:"renewResults"`
	}
	out := outStruct{Checkouts: checkouts}
	json.Unmarshal(rawRespBytes, &out.RenewResults)
	c.JSON(http.StatusOK, out)
}

// GetUserCheckouts uses ILS Connector V4 API /users to get checked out items
func (svc *ServiceContext) GetUserCheckouts(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Get checkouts for user %s with ILS Connector...", userID)
	userURL := fmt.Sprintf("%s/v4/users/%s/checkouts", svc.ILSAPI, userID)
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
	userURL := fmt.Sprintf("%s/v4/users/%s/checkouts.csv", svc.ILSAPI, userID)
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
	userURL := fmt.Sprintf("%s/v4/users/%s/holds", svc.ILSAPI, userID)
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

	userURL := fmt.Sprintf("%s/v4/users/%s", svc.ILSAPI, userID)
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

	log.Printf("Get leo delivery address")
	leoLocation := make([]string, 0)
	hasIlliad := false
	respBytes, illErr := svc.ILLiadRequest("GET", fmt.Sprintf("Users/%s", userID), nil)
	if illErr != nil {
		log.Printf("WARN: unable to get leo address info: %s", illErr.Message)
	} else {
		var resp map[string]interface{}
		if err := json.Unmarshal(respBytes, &resp); err != nil {
			log.Printf("ERROR: unable to parse ILLIAD user response: %s", err.Error())
		} else {
			val, ok := resp["Department"].(string)
			if ok && val != "" {
				leoLocation = append(leoLocation, val)
			}
			val, ok = resp["Organization"].(string)
			if ok && val != "" {
				leoLocation = append(leoLocation, val)
			}
			val, ok = resp["Country"].(string)
			if ok && val != "" {
				leoLocation = append(leoLocation, val)
				hasIlliad = true
				log.Printf("INFO: %s has ILLiad account [%s]", userID, val)
			}
		}
	}

	// Combine local V4 database user info with ILS user info and return results to client
	type fullUser struct {
		*User
		UserInfo      *ILSUserInfo `json:"user"`
		ILLiadAccount bool         `json:"hasIlliadAccount"`
		LeoLocation   string       `json:"leoLocation"`
	}
	user := fullUser{User: &v4User, UserInfo: &ilsUser, LeoLocation: strings.Join(leoLocation, ", "), ILLiadAccount: hasIlliad}
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
			return fmt.Sprintf("No Change")
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
	createURL := fmt.Sprintf("%s/v4/users/register", svc.ILSAPI)
	_, ilsErr := svc.ILSConnectorPost(createURL, req, c.GetString("jwt"))
	if ilsErr != nil {
		log.Printf("ERROR: Temp account create failed for %s \n %s", req.Email, ilsErr.Message)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	log.Printf("INFO: Temp account created for %s", req.Email)
	c.String(http.StatusCreated, "Temp account created")
	return

}

// ActivateTempAccount accepts a user account request and creates a temporary account in Sirsi via ils-connector
func (svc *ServiceContext) ActivateTempAccount(c *gin.Context) {

	token := c.Query("token")
	if token == "" {
		log.Printf("WARN: missing activation token")
		c.Redirect(http.StatusFound, "/signin?activated=false")
		return
	}

	activateURL := fmt.Sprintf("%s/v4/users/activate/%s", svc.ILSAPI, token)
	_, ilsErr := svc.ILSConnectorGet(activateURL, c.GetString("jwt"), svc.HTTPClient)
	if ilsErr != nil {
		log.Printf("WARN: Temp account activation failed")
		c.Redirect(http.StatusFound, "/signin?activated=false")
		return
	}
	log.Printf("INFO: Temp account activated")
	c.Redirect(http.StatusFound, "/signin?activated=true")
	return

}
