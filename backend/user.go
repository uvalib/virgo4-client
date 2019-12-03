package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
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
	ID            int       `db:"id" json:"-"`
	Virgo4ID      string    `db:"virgo4_id" json:"id"`
	AuthToken     string    `db:"auth_token" json:"-"`
	AuthUpdatedAt time.Time `db:"auth_updated_at" json:"-"`
	SignedIn      bool      `db:"signed_in" json:"-"`
	Bookmarks     []*Folder `db:"-" json:"bookmarks"`
	Preferences   string    `db:"preferences" json:"preferences"`
}

// TableName sets the name of the table in the DB that this struct binds to
func (u *V4User) TableName() string {
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
	UserInfo    *ILSUserInfo `json:"user"`
	AuthToken   string       `json:"authToken"`
	Bookmarks   []*Folder    `json:"bookmarks"`
	Preferences string       `json:"preferences"`
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

	log.Printf("Renew checkouts [%s] for user %s with ILS Connector...", qp.Barcode, userID)
	renewURL := fmt.Sprintf("%s/v4/request/renewAll", svc.ILSAPI)
	values := url.Values{"computing_id": {userID}}
	if qp.Barcode != "all" {
		renewURL = fmt.Sprintf("%s/v4/request/renew", svc.ILSAPI)
		values.Add("item_barcode", qp.Barcode)
	}
	rawRespBytes, err := svc.ILSConnectorPost(renewURL, values)
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
		log.Printf("USER PREFS: %+v", v4User.Preferences)
		v4User.GetBookmarks(svc.DB)
	}

	user := User{UserInfo: &ilsUser,
		AuthToken:   v4User.AuthToken,
		Bookmarks:   v4User.Bookmarks,
		Preferences: v4User.Preferences,
	}
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
