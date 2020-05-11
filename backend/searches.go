package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
	"github.com/rs/xid"
	"github.com/uvalib/virgo4-jwt/v4jwt"
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
	URL       string    `db:"search_url" json:"url"`
}

// TableName sets the name of the table in the DB that this struct binds to
func (s SavedSearch) TableName() string {
	return "saved_searches"
}

// DeleteAllSavedSearches will remove all saved searches from a user account
func (svc *ServiceContext) DeleteAllSavedSearches(c *gin.Context) {
	uid := c.Param("uid")
	log.Printf("Delete ALL saved searches for user %s...", uid)
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

	dq := svc.DB.NewQuery("delete from saved_searches where user_id={:uid}")
	dq.Bind(dbx.Params{"uid": userID})
	_, err := dq.Execute()
	if err != nil {
		log.Printf("ERROR: unable to delete saved searches for %s (%d): %s", uid, userID, err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.String(http.StatusOK, "ok")
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

// DeleteSavedSearch will delete a saved search with the matching token
func (svc *ServiceContext) DeleteSavedSearch(c *gin.Context) {
	uid := c.Param("uid")
	token := c.Param("token")
	log.Printf("User %s delete search %s...", uid, token)

	var userID int
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": uid})
	uErr := uq.Row(&userID)
	if uErr != nil {
		log.Printf("ERROR: couldn't find user %s to delete saved search %s: %v", uid, token, uErr)
		c.JSON(http.StatusBadRequest, fmt.Sprintf("Invalid user %s", uid))
		return
	}

	dq := svc.DB.NewQuery("delete from saved_searches where user_id={:userID} and token={:token}")
	dq.Bind(dbx.Params{"userID": userID})
	dq.Bind(dbx.Params{"token": token})
	_, dErr := dq.Execute()
	if dErr != nil {
		log.Printf("ERROR: couldn't delete user %s saved search %s: %v", uid, token, dErr)
		c.JSON(http.StatusInternalServerError, dErr.Error)
		return
	}

	c.String(http.StatusOK, "ok")
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
		Token    string `json:"token"`
		Name     string `json:"name"`
		URL      string `json:"url"`
		IsPublic bool   `json:"isPublic"`
		History  bool   `json:"history"`
	}
	qpErr := c.ShouldBindJSON(&reqObj)
	if qpErr != nil {
		log.Printf("ERROR: invalid saved search payload: %v", qpErr)
		resp.Message = qpErr.Error()
		c.JSON(http.StatusBadRequest, resp)
		return
	}

	// If this is flagged as historic, save it in the history table (and push out old if necessary)
	if reqObj.History == true {
		// quietly add to history; don't care if it fails, this is just an attempt to provide a history
		svc.updateSearchHistory(userID, reqObj.URL)
		c.String(http.StatusOK, "")
		return
	}

	if reqObj.Token == "" {
		// Generate an access token and save it to the saved searches table
		search := SavedSearch{Token: xid.New().String(), UserID: userID, Name: reqObj.Name,
			CreatedAt: time.Now(), URL: reqObj.URL, Public: reqObj.IsPublic, Search: "{}"}
		err := svc.DB.Model(&search).Insert()
		if err != nil {
			log.Printf("ERROR: User %s unable to add saved search %+v: %v", uid, reqObj, err)
			resp.Message = err.Error()
			c.JSON(http.StatusInternalServerError, resp)
			return
		}
		log.Printf("User %s search %s saved as %s", uid, reqObj.Name, search.Token)
		resp.Token = search.Token
	} else {
		log.Printf("Convert old-style search %s to URL", reqObj.Token)
		q := svc.DB.NewQuery("update saved_searches set search_url={:u}, search={:empty} where token={:tok}")
		q.Bind(dbx.Params{"tok": reqObj.Token})
		q.Bind(dbx.Params{"u": reqObj.URL})
		q.Bind(dbx.Params{"empty": "{}"})
		_, e := q.Execute()
		if e != nil {
			log.Printf("ERROR: unable to convert search %s: %s", reqObj.Token, e.Error())
		}
	}

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
		c.JSON(http.StatusOK, search)
		return
	}

	log.Printf("Search %s is private to userID %d", token, search.UserID)
	claimsIface, signedIn := c.Get("claims")
	if signedIn == false {
		log.Printf("Private search cannot be accessed by non-signed-in user (no claims present)")
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}
	claims, ok := claimsIface.(*v4jwt.V4Claims)
	if ok == false {
		log.Printf("ERROR: invalid claims found")
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}

	var userID int
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": claims.UserID})
	uErr := uq.Row(&userID)
	if uErr != nil {
		log.Printf("Private search couldn't locate user %s: %s", claims.UserID, uErr.Error())
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}

	if userID != search.UserID {
		log.Printf("Private search not available to user")
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}
	c.JSON(http.StatusOK, search)
}

// GetUserSavedSearches will get all of the searches saved by the specified user
func (svc *ServiceContext) GetUserSavedSearches(c *gin.Context) {
	v4id := c.Param("uid")
	log.Printf("Get saved searches for %s", v4id)
	var userID int
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": v4id})
	uErr := uq.Row(&userID)
	if uErr != nil {
		log.Printf("User %s not found", v4id)
		c.JSON(http.StatusNotFound, make([]SavedSearch, 0))
		return
	}

	var resp struct {
		Saved   []SavedSearch `json:"saved"`
		History []string      `json:"history"`
	}

	svc.DB.Select().Where(dbx.HashExp{"user_id": userID}).OrderBy("name asc").All(&resp.Saved)
	q := svc.DB.NewQuery("select url from search_history where user_id={:uid} order by created_at desc")
	q.Bind(dbx.Params{"uid": userID})
	rows, err := q.Rows()
	if err != nil {
		log.Printf("ERROR: unable to get search history for %s: %s", v4id, err.Error())
		resp.History = make([]string, 0)
	} else {
		for rows.Next() {
			var url string
			rows.Scan(&url)
			resp.History = append(resp.History, url)
		}
	}
	c.JSON(http.StatusOK, resp)
}

func (svc *ServiceContext) updateSearchHistory(userID int, url string) {
	sq := svc.DB.NewQuery("insert into search_history (user_id, url) values ({:uid}, {:url})")
	sq.Bind(dbx.Params{"uid": userID})
	sq.Bind(dbx.Params{"url": url})
	_, err := sq.Execute()
	if err != nil {
		log.Printf("ERROR: Unable to save search history for user %d: %s", userID, err.Error())
		return
	}

	// now delete any saves after the 15th (ordered by date descending)
	sel := "select id from saved_searches where user_id={:uid} order by date_created desc offset 15"
	sq = svc.DB.NewQuery(fmt.Sprintf("delete from saved_searches where id in (%s)", sel))
	sq.Bind(dbx.Params{"uid": userID})
	_, err = sq.Execute()
	if err != nil {
		log.Printf("ERROR: Unable to limit history for user %d: %s", userID, err.Error())
		return
	}

}
