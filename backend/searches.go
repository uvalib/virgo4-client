package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
	"github.com/rs/xid"
)

// SavedSearch contains details about a user saved seatch
type SavedSearch struct {
	ID        int       `db:"id" json:"-"`
	UserID    int       `db:"user_id" json:"-"`
	Token     string    `db:"token" json:"token"`
	Name      string    `db:"name" json:"name"`
	Public    bool      `db:"is_public" json:"public"`
	CreatedAt time.Time `db:"created_at" json:"created"`
	Search    string    `db:"search" json:"search"`
}

// TableName sets the name of the table in the DB that this struct binds to
func (s SavedSearch) TableName() string {
	return "saved_searches"
}

// PublishSavedSearch will make a private search public
func (svc *ServiceContext) PublishSavedSearch(c *gin.Context) {
	uid := c.Param("uid")
	token := c.Param("token")
	log.Printf("User %s publish saved search %s...", uid, token)
	svc.setSearchVisibility(c, uid, token, true)
}

func (svc *ServiceContext) setSearchVisibility(c *gin.Context, uid string, token string, public bool) {
	var userID int
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": uid})
	uErr := uq.Row(&userID)
	if uErr != nil {
		log.Printf("ERROR: couldn't find user %s: %v", uid, uErr)
		c.String(http.StatusBadRequest, "Invalid user %s", uid)
		return
	}
	log.Printf("User %s has ID %d", uid, userID)

	sq := svc.DB.NewQuery("update saved_searches set is_public={:pub} where user_id={:uid} and token={:tok}")
	sq.Bind(dbx.Params{"pub": public})
	sq.Bind(dbx.Params{"uid": userID})
	sq.Bind(dbx.Params{"tok": token})
	_, err := sq.Execute()
	if err != nil {
		c.String(http.StatusBadRequest, "Publish failed %s", err.Error())
		return
	}
	c.String(http.StatusOK, "ok")
}

// UnpublishSavedSearch will make a public search private
func (svc *ServiceContext) UnpublishSavedSearch(c *gin.Context) {
	uid := c.Param("uid")
	token := c.Param("token")
	log.Printf("User %s unpublish saved search %s...", uid, token)
	svc.setSearchVisibility(c, uid, token, false)
}

// SaveSearch will save a named search in that saved_searches table along with an access token
func (svc *ServiceContext) SaveSearch(c *gin.Context) {
	uid := c.Param("uid")
	log.Printf("User %s save search request...", uid)

	// init a reqponse object
	var resp struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Token   string `json:"token"`
	}

	var userID int
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": uid})
	uErr := uq.Row(&userID)
	if uErr != nil {
		log.Printf("ERROR: coubdn't find user %s: %v", uid, uErr)
		resp.Message = "Invalid Virgo user"
		c.JSON(http.StatusBadRequest, resp)
		return
	}

	// Make sure the passed request object is well formed JSON
	var reqObj struct {
		Name     string      `json:"name"`
		Search   interface{} `json:"search"`
		IsPublic bool        `json:"isPublic"`
	}
	qpErr := c.ShouldBindJSON(&reqObj)
	if qpErr != nil {
		log.Printf("ERROR: invalid saved search payload: %v", qpErr)
		resp.Message = qpErr.Error()
		c.JSON(http.StatusBadRequest, resp)
		return
	}

	// Generate an access token and save it to the saved searches table
	json, _ := json.Marshal(reqObj.Search)
	search := SavedSearch{Token: xid.New().String(), UserID: userID, Name: reqObj.Name,
		CreatedAt: time.Now(), Search: string(json), Public: reqObj.IsPublic}
	err := svc.DB.Model(&search).Insert()
	if err != nil {
		log.Printf("ERROR: User %s unable to add saved search %+v: %v", uid, reqObj, err)
		resp.Message = err.Error()
		c.JSON(http.StatusInternalServerError, resp)
		return
	}

	log.Printf("User %s search %s saved as %s", uid, reqObj.Name, search.Token)
	resp.Token = search.Token
	resp.Success = true
	resp.Message = "Search saved"

	c.JSON(http.StatusOK, resp)
}

// GetSearch will get search data by token. If the search is not public, it will check the auth token
// and ensure that it belongs to the signed in user that saved it
func (svc *ServiceContext) GetSearch(c *gin.Context) {
	token := c.Param("token")
	log.Printf("Get saved search %s", token)
	var search SavedSearch
	err := svc.DB.Select().Where(dbx.HashExp{"token": token}).One(&search)
	if err != nil {
		log.Printf("Search %s not found", token)
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}

	if search.Public {
		log.Printf("Search %s is public", token)
		c.JSON(http.StatusOK, search.Search)
		return
	}

	log.Printf("Search %s is private to userID %d", token, search.UserID)
	authToken := c.GetString("token")
	var userID int
	uq := svc.DB.NewQuery("select id from users where auth_token={:t} and signed_in={:si}")
	uq.Bind(dbx.Params{"t": authToken})
	uq.Bind(dbx.Params{"si": true})
	uErr := uq.Row(&userID)
	if uErr != nil {
		log.Printf("Private search couldn't locate authg user: %s", uErr.Error())
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}

	if userID != search.UserID {
		log.Printf("Private search not available to user")
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}

	c.JSON(http.StatusOK, search.Search)
}

// GetUserSavedSearches will get all of the searches saved by the specified user
func (svc *ServiceContext) GetUserSavedSearches(c *gin.Context) {
	uid := c.Param("uid")
	log.Printf("Get saved searches for %s", uid)
	var userID int
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": uid})
	uErr := uq.Row(&userID)
	if uErr != nil {
		log.Printf("User %s not found", uid)
		c.JSON(http.StatusNotFound, make([]SavedSearch, 0))
		return
	}

	var searches []SavedSearch
	svc.DB.Select().Where(dbx.HashExp{"user_id": userID}).OrderBy("name asc").All(&searches)
	c.JSON(http.StatusOK, searches)

}
