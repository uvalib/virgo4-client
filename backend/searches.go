package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
	"github.com/rs/xid"
)

// SavedSearch contains details about a user saved seatch
type SavedSearch struct {
	ID        int       `json:"id"`
	UserID    int       `json:"-"`
	Token     string    `json:"token"`
	Name      string    `json:"name"`
	IsPublic  bool      `json:"public"`
	CreatedAt time.Time `json:"created"`
	SearchURL string    `json:"url"`
}

// SearchHistory contains data about a user searching history
type SearchHistory struct {
	ID        int       `json:"id"`
	UserID    int       `json:"-"`
	URL       string    `json:"url"`
	CreatedAt time.Time `json:"created"`
}

// TableName sets the name of the table in the DB that this struct binds to
func (s SearchHistory) TableName() string {
	return "search_history"
}

// DeleteAllSavedSearches will remove all saved searches from a user account
func (svc *ServiceContext) DeleteAllSavedSearches(c *gin.Context) {
	uid := c.Param("uid")
	clearType := c.Query("type")
	userID := c.MustGet("v4id").(int)
	log.Printf("Delete searches (%s) for user %s...", clearType, uid)
	if clearType != "history" && clearType != "saved" {
		log.Printf("ERROR: unsupported search type %s", clearType)
		c.String(http.StatusBadRequest, fmt.Sprintf("'%s' is not a valid search type", clearType))
		return
	}

	qs := "delete from saved_searches where user_id={:uid}"
	if clearType == "history" {
		qs = "delete from search_history where user_id={:uid}"
	}
	dq := svc.DB.NewQuery(qs)
	dq.Bind(dbx.Params{"uid": userID})
	_, err := dq.Execute()
	if err != nil {
		log.Printf("ERROR: unable to delete searches (%s) for %s (%d): %s", clearType, uid, userID, err.Error())
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
	userID := c.MustGet("v4id").(int)
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
	userID := c.MustGet("v4id").(int)
	log.Printf("User %s delete search %s...", uid, token)

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

// UpdateSavedSearch will update URL of a previpously saved search. This is temporary until
// all searches have been converted
func (svc *ServiceContext) UpdateSavedSearch(c *gin.Context) {
	uid := c.Param("uid")
	v4UserID := c.MustGet("v4id").(int)
	token := c.Param("token")
	log.Printf("User %s update saved search request", uid)

	var req struct {
		URL string `json:"url"`
	}
	qpErr := c.ShouldBindJSON(&req)
	if qpErr != nil {
		log.Printf("ERROR: invalid saved search payload: %v", qpErr)
		c.String(http.StatusBadRequest, qpErr.Error())
		return
	}

	sq := svc.DB.NewQuery("update saved_searches set search_url={:url} where user_id={:uid} and token={:tok}")
	sq.Bind(dbx.Params{"url": req.URL})
	sq.Bind(dbx.Params{"uid": v4UserID})
	sq.Bind(dbx.Params{"tok": token})
	_, err := sq.Execute()
	if err != nil {
		c.String(http.StatusInternalServerError, "Update failed %s", err.Error())
		return
	}

	c.String(http.StatusOK, "ok")
}

// SaveSearch will save a named search in that saved_searches table along with an access token
func (svc *ServiceContext) SaveSearch(c *gin.Context) {
	uid := c.Param("uid")
	userID := c.MustGet("v4id").(int)
	log.Printf("User %s[%d] save search request...", uid, userID)

	// init a reqponse object
	var resp struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Token   string `json:"token"`
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
			CreatedAt: time.Now(), SearchURL: reqObj.URL, IsPublic: reqObj.IsPublic}
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
		q := svc.DB.NewQuery("update saved_searches set search_url={:u} where token={:tok}")
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

	if search.IsPublic {
		log.Printf("Search %s is public", token)
		c.JSON(http.StatusOK, search)
		return
	}

	log.Printf("Search %s is private to userID %d", token, search.UserID)
	claims, error := getJWTClaims(c)
	if error != nil {
		log.Printf("ERROR: %s", error.Error())
		c.String(http.StatusUnauthorized, error.Error())
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
	userID := c.GetInt("v4id")
	log.Printf("Get saved searches for %s[%d]", v4id, userID)

	var resp struct {
		Saved   []SavedSearch   `json:"saved"`
		History []SearchHistory `json:"history"`
	}
	resp.Saved = make([]SavedSearch, 0)
	resp.History = make([]SearchHistory, 0)
	svc.GDB.Where("user_id=?", userID).Order("name asc").Find(&resp.Saved)
	dbResp := svc.GDB.Where("user_id=?", userID).Order("created_at desc").Find(&resp.History)
	if dbResp.Error != nil {
		log.Printf("ERROR: unable to get history: %s", dbResp.Error.Error())
	} else {
		log.Printf("INFO: history %+v", resp.History)
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
	log.Printf("Limit saved searches for user %d to 15...", userID)
	sel := "select id from search_history where user_id={:uid} order by created_at desc offset 15"
	qStr := fmt.Sprintf("delete from search_history where id in (%s)", sel)
	sq = svc.DB.NewQuery(qStr)
	sq.Bind(dbx.Params{"uid": userID})
	_, err = sq.Execute()
	if err != nil {
		log.Printf("ERROR: Unable to limit history for user %d: %s", userID, err.Error())
		return
	}
}
