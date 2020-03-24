package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
)

// NewV4User creates a new instance of user settings with internal data initialzied
func NewV4User() *V4User {
	return &V4User{Bookmarks: make([]*Folder, 0, 0)}
}

// V4User contains virgo4 user data like session token, bookmarks and preferences
type V4User struct {
	ID             int        `db:"id" json:"-"`
	Virgo4ID       string     `db:"virgo4_id" json:"id"`
	Role           string     `db:"role" json:"role"`
	LockedOut      bool       `db:"locked_out" json:"-"`
	LockedOutUntil *time.Time `db:"locked_out_until" json:"-"`
	AuthStartedAt  *time.Time `db:"auth_started_at" json:"-"`
	AuthTries      int        `db:"auth_tries" json:"-"`
	Bookmarks      []*Folder  `db:"-" json:"bookmarks"`
	Preferences    string     `db:"preferences" json:"preferences"`
}

// TableName sets the name of the table in the DB that this struct binds to
func (u V4User) TableName() string {
	return "users"
}

// ILSUserInfo contains ILS connector details for a user
type ILSUserInfo struct {
	ID            string `json:"id"`
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
}

// IsGraduate returns true if this user is a graduate student
func (u *ILSUserInfo) IsGraduate() bool {
	match, _ := regexp.MatchString("(?i)graduate student", u.Description)
	if match {
		return true
	}
	match, _ = regexp.MatchString("(?i)grad", u.Profile)
	return match
}

// IsUndergraduate returns true if this user is an undergraduate student
func (u *ILSUserInfo) IsUndergraduate() bool {
	match, _ := regexp.MatchString("(?i)undergraduate", u.Description)
	if match {
		return true
	}
	match, _ = regexp.MatchString("(?i)(ugrad)|(undergrad)", u.Profile)
	return match
}

// IsAlumni returns true if this user is an alumni
func (u *ILSUserInfo) IsAlumni() bool {
	match, _ := regexp.MatchString("(?i)Alumn", u.Profile)
	return match
}

// IsFaculty returns true if this user is faculty
func (u *ILSUserInfo) IsFaculty() bool {
	match, _ := regexp.MatchString("(?i)faculty", u.Description)
	if match {
		return true
	}
	match, _ = regexp.MatchString("(?i)faculty", u.Profile)
	return match
}

// IsInstructor returns true if this user is an instructor
func (u *ILSUserInfo) IsInstructor() bool {
	match, _ := regexp.MatchString("(?i)instructor", u.Description)
	if match {
		return true
	}
	match, _ = regexp.MatchString("(?i)instruct", u.Profile)
	return match
}

// IsStaff returns true if this user is staff
func (u *ILSUserInfo) IsStaff() bool {
	match, _ := regexp.MatchString("(?i)staff", u.Description)
	if match {
		return true
	}
	match, _ = regexp.MatchString("(?i)(employee)(staff)", u.Profile)
	return match
}

// CanPlaceReserve returns true if this user can place an item on course reserve
func (u *ILSUserInfo) CanPlaceReserve() bool {
	if u.IsGraduate() || u.IsUndergraduate() || u.IsAlumni() {
		return false
	}
	match, _ := regexp.MatchString("(?i)(Virginia Borrower)|(Other VA Faculty)", u.Profile)
	return match == false
}

// CanPurchase returns true if this user can request to purchase items
func (u *ILSUserInfo) CanPurchase() bool {
	return u.IsGraduate() || u.IsUndergraduate() || u.IsFaculty() || u.IsInstructor() || u.IsStaff()
}

// CheckoutInfo has sumary info for a checked out item
type CheckoutInfo struct {
	ID         string `json:"id"`
	Barcode    string `json:"barcode"`
	Title      string `json:"title"`
	Author     string `json:"author"`
	CallNumber string `json:"callNumber"`
	Library    string `json:"library"`
	DueDate    string `json:"due"`
	OverDue    bool   `json:"overdue"`
	Fee        string `json:"overdueFee"`
	RecallDate string `json:"recallDate"`
	RenewDate  string `json:"renewDate"`
}

// User contains all user data collected from ILS and Virgo4 sources
type User struct {
	*V4User
	UserInfo *ILSUserInfo `json:"user"`
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
	_, ilsErr := svc.ILSConnectorPost(pinURL, qp)
	if ilsErr != nil {
		log.Printf("User %s pin change failed", qp.UserBarcode)
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}
	c.String(http.StatusOK, "pin changed")
}

// GetUserBills uses ILS Connector user billing details
func (svc *ServiceContext) GetUserBills(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Get bills for user %s with ILS Connector...", userID)
	userURL := fmt.Sprintf("%s/v4/users/%s/bills", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
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
	rawRespBytes, err := svc.ILSConnectorPost(renewURL, ilsReq)
	if err != nil {
		c.String(err.StatusCode, err.Message)
		return
	}

	// Get all of the user checkouts after the renew so dates/status are updated
	userURL := fmt.Sprintf("%s/v4/users/%s/checkouts", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL)
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

// GetUserCheckouts uses ILS Connector V2 API /users to get checked out items
func (svc *ServiceContext) GetUserCheckouts(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Get checkouts for user %s with ILS Connector...", userID)
	userURL := fmt.Sprintf("%s/v4/users/%s/checkouts", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL)
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

	c.JSON(http.StatusOK, checkouts)
}

// GetUser uses ILS Connector V2 API /users to get details for a user
func (svc *ServiceContext) GetUser(c *gin.Context) {
	userID := c.Param("uid")
	log.Printf("Get info for user %s with ILS Connector...", userID)

	userURL := fmt.Sprintf("%s/v4/users/%s", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL)
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
	v4User := NewV4User()
	q := svc.DB.NewQuery(`select * from users where virgo4_id={:id}`)
	q.Bind(dbx.Params{"id": userID})
	err := q.One(v4User)
	if err != nil {
		log.Printf("ERROR: No v4 user settings found for %s: %+v", userID, err)
	} else {
		v4User.GetBookmarks(svc.DB)
	}

	user := User{V4User: v4User, UserInfo: &ilsUser}
	c.JSON(http.StatusOK, user)
}

// SavePreferences will save a block of JSON preference data to the user table
func (svc *ServiceContext) SavePreferences(c *gin.Context) {
	uid := c.Param("uid")

	// Bind POST params to interface to be sure they are well formed
	var prefs interface{}
	err := c.ShouldBindJSON(&prefs)
	if err != nil {
		log.Printf("ERROR: unable to get preference data from %s: %s", uid, err)
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	// Data is good. Back to JSON string and save...
	jsonPrefs, _ := json.Marshal(prefs)
	uq := svc.DB.NewQuery("update users set preferences={:p} where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": uid})
	uq.Bind(dbx.Params{"p": jsonPrefs})
	_, err = uq.Execute()
	if err != nil {
		log.Printf("ERROR: unable to save preference data for %s: %s", uid, err)
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	c.String(http.StatusOK, "OK")
}
