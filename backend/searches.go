package main

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/xid"
	"gorm.io/gorm"
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
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	clearType := c.Query("type")
	log.Printf("INFO: delete searches (%s) for user %s[%d]...", clearType, v4UserID, userID)
	if clearType != "history" && clearType != "saved" {
		log.Printf("ERROR: unsupported search type %s", clearType)
		c.String(http.StatusBadRequest, fmt.Sprintf("'%s' is not a valid search type", clearType))
		return
	}

	var dbResp *gorm.DB
	if clearType == "history" {
		dbResp = svc.GDB.Delete(SearchHistory{}, "user_id=?", userID)
	} else if clearType == "saved" {
		dbResp = svc.GDB.Delete(SavedSearch{}, "user_id=?", userID)
	}

	if dbResp.Error != nil {
		log.Printf("ERROR: unable to delete searches (%s) for %s[%d]: %s", clearType, v4UserID, userID, dbResp.Error.Error())
		c.String(http.StatusInternalServerError, dbResp.Error.Error())
		return
	}

	c.String(http.StatusOK, "ok")
}

// PublishSavedSearch will make a private search public
func (svc *ServiceContext) PublishSavedSearch(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	searchID, _ := strconv.Atoi(c.Param("id"))
	log.Printf("User %s[%d] publish saved search %d...", v4UserID, userID, searchID)
	svc.setSearchVisibility(c, userID, searchID, true)
}

func (svc *ServiceContext) setSearchVisibility(c *gin.Context, userID int, searchID int, public bool) {
	var search SavedSearch
	resp := svc.GDB.Find(&search, searchID)
	if resp.Error != nil {
		log.Printf("Search %d not found: %s", searchID, resp.Error.Error())
		c.String(http.StatusNotFound, "folder not found")
		return
	}
	search.IsPublic = public
	resp = svc.GDB.Model(&search).Select("IsPublic").Updates(search)
	if resp.Error != nil {
		log.Printf("ERROR: set visibility forsearch %d failed: %s", searchID, resp.Error.Error())
		c.String(http.StatusInternalServerError, resp.Error.Error())
		return
	}
	c.String(http.StatusOK, "ok")
}

// UnpublishSavedSearch will make a public search private
func (svc *ServiceContext) UnpublishSavedSearch(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	searchID, _ := strconv.Atoi(c.Param("id"))
	log.Printf("User %s[%d] publish saved search %d...", v4UserID, userID, searchID)
	svc.setSearchVisibility(c, userID, searchID, false)
}

// DeleteSavedSearch will delete a saved search with the matching token
func (svc *ServiceContext) DeleteSavedSearch(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	searchID, _ := strconv.Atoi(c.Param("id"))
	log.Printf("INFO: user %s[%d] delete search %d request", v4UserID, userID, searchID)

	resp := svc.GDB.Delete(&SavedSearch{}, searchID)
	if resp.Error != nil {
		log.Printf("ERROR: couldn't delete user %s[%d] saved search %d: %s", v4UserID, userID, searchID, resp.Error.Error())
		c.JSON(http.StatusInternalServerError, resp.Error.Error())
		return
	}

	c.String(http.StatusOK, "ok")
}

// SavedSearchExists will check a user saved search list to see if a URL has already been saved
func (svc *ServiceContext) SavedSearchExists(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	tgtQuery := strings.TrimSpace(c.Query("tgt"))
	log.Printf("INFO: check if user %s[%d] has already saved [%s]", v4UserID, userID, tgtQuery)

	resp := struct {
		Exists bool   `json:"exists"`
		Token  string `json:"token"`
		Name   string `json:"name"`
	}{}

	var existSearch SavedSearch
	err := svc.GDB.Where("search_url=? and user_id=?", tgtQuery, userID).Limit(1).Find(&existSearch).Error
	if err != nil {
		log.Printf("ERROR: unable to determine if user %s has aleady saved [%s]: %s", v4UserID, tgtQuery, err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	if existSearch.ID > 0 {
		resp.Exists = true
		resp.Token = existSearch.Token
		resp.Name = existSearch.Name
	} else {
		resp.Exists = false
	}
	c.JSON(http.StatusOK, resp)
}

// SaveSearch will save a named search in that saved_searches table along with an access token
func (svc *ServiceContext) SaveSearch(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	log.Printf("INFO: user %s[%d] save search request...", v4UserID, userID)

	// init a reqponse object
	var resp struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Token   string `json:"token"`
		Name    string `json:"name"`
	}

	// Make sure the passed request object is well formed JSON
	var reqObj struct {
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

	// Generate an access token and save it to the saved searches table
	search := SavedSearch{Token: xid.New().String(), UserID: userID, Name: reqObj.Name,
		CreatedAt: time.Now(), SearchURL: reqObj.URL, IsPublic: reqObj.IsPublic}
	dbResp := svc.GDB.Create(&search)
	if dbResp.Error != nil {
		log.Printf("ERROR: user %s unable to add saved search %+v: %s", v4UserID, reqObj, dbResp.Error.Error())
		resp.Message = dbResp.Error.Error()
		c.JSON(http.StatusInternalServerError, resp)
		return
	}
	log.Printf("User %s search %s saved as %s", v4UserID, reqObj.Name, search.Token)
	resp.Token = search.Token
	resp.Success = true
	resp.Message = "Search saved"
	resp.Name = reqObj.Name

	c.JSON(http.StatusOK, resp)
}

// GetSearch will get search data by token. If the search is not public, it will check the auth token
// and ensure that it belongs to the signed in user that saved it
func (svc *ServiceContext) GetSearch(c *gin.Context) {
	token := c.Param("token")
	log.Printf("Get saved search %s", token)
	var search SavedSearch
	resp := svc.GDB.Where("token=?", token).First(&search)
	if resp.Error != nil {
		log.Printf("ERROR: get search %s failed: %s", token, resp.Error.Error())
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}

	if search.IsPublic {
		log.Printf("INFO: search %s is public", token)
		c.JSON(http.StatusOK, search)
		return
	}

	log.Printf("INFO: %s is private to userID %d; looking up existing user claims", token, search.UserID)
	claims, err := getJWTClaims(c)
	if err != nil {
		log.Printf("ERROR: %s", err.Error())
		c.String(http.StatusUnauthorized, err.Error())
		return
	}

	log.Printf("INFO: lookup userID for %s", claims.UserID)
	var user User
	resp = svc.GDB.Where("virgo4_id=?", claims.UserID).First(&user)
	if resp.Error != nil {
		log.Printf("ERROR: private search couldn't locate user %s: %s", claims.UserID, resp.Error.Error())
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}

	if user.ID != search.UserID {
		log.Printf("INFO: search %s is private to user %d; not available to user %d", token, search.UserID, user.ID)
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
	history := SearchHistory{UserID: userID, URL: url, CreatedAt: time.Now()}
	log.Printf("INFO: add search history %+v", history)
	addResp := svc.GDB.Create(&history)
	if addResp.Error != nil {
		log.Printf("ERROR: Unable to save search history for user %d: %s", userID, addResp.Error.Error())
		return
	}

	// now delete any saves after the 15th (ordered by date descending)
	log.Printf("INFO: limit saved searches for user %d to 15", userID)
	var old []SearchHistory
	svc.GDB.Where("user_id=?", userID).Order("created_at desc").Offset(15).Find(&old)
	log.Printf("INFO: user %d has %d search history entries beyond 15", userID, len(old))
	if len(old) > 0 {
		ids := make([]int, 0)
		for _, h := range old {
			ids = append(ids, h.ID)
		}
		resp := svc.GDB.Delete(SearchHistory{}, ids)
		if resp.Error != nil {
			log.Printf("ERROR: unable to limit history for user %d: %s", userID, resp.Error.Error())
		}
	}
}
