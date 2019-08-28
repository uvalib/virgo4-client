package main

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
)

// NewUserSettings creates a new instance of user settings with internal data initialzied
func NewUserSettings() *UserSettings {
	return &UserSettings{Bookmarks: make(map[string][]Bookmark)}
}

// UserSettings contains virgo4 user data like session token, bookmarks and preferences
type UserSettings struct {
	ID            int                   `db:"id" json:"-"`
	Virgo4ID      string                `db:"virgo4_id" json:"id"`
	AuthToken     string                `db:"auth_token" json:"-"`
	AuthUpdatedAt time.Time             `db:"auth_updated_at" json:"-"`
	SignedIn      bool                  `db:"signed_in" json:"-"`
	Bookmarks     map[string][]Bookmark `db:"-" json:"bookmarks"`
}

// TableName sets the name of the table in the DB that this struct binds to
func (u *UserSettings) TableName() string {
	return "users"
}

// GetBookmarks will load all folders and bookmarks for a user
func (u *UserSettings) GetBookmarks(db *dbx.DB) {
	log.Printf("Load bookmarks for %s", u.Virgo4ID)
	q := db.NewQuery(`SELECT f.name as folder, s.name as pool, b.identifier, b.details, b.added_at
	 	FROM bookmark_folders f  
			LEFT JOIN bookmarks b ON b.folder_id=f.id
			LEFT JOIN sources s ON s.id = b.source_id 
		WHERE f.user_id={:id} ORDER BY added_at ASC`)
	q.Bind(dbx.Params{"id": u.ID})
	rows, err := q.Rows()
	if err != nil {
		log.Printf("Unable to get bookmarks for %s:%v", u.Virgo4ID, err)
		return
	}

	// parse each bookmark row into the UserSettings structure
	for rows.Next() {
		var raw struct {
			Folder     string    `db:"folder"`
			Pool       string    `db:"pool"`
			Identifier string    `db:"identifier"`
			Details    string    `db:"details"`
			AddedAt    time.Time `db:"added_at"`
		}
		rows.ScanStruct(&raw)
		if _, ok := u.Bookmarks[raw.Folder]; !ok {
			u.Bookmarks[raw.Folder] = make([]Bookmark, 0)
		}
		if raw.Identifier != "" {
			bookmark := Bookmark{Pool: raw.Pool, Identifier: raw.Identifier, AddedAt: raw.AddedAt}
			err := json.Unmarshal([]byte(raw.Details), &bookmark.Details)
			if err != nil {
				log.Printf("Unable to parse bookmark data %s: %v", raw.Details, err)
			} else {
				u.Bookmarks[raw.Folder] = append(u.Bookmarks[raw.Folder], bookmark)
			}
		}
	}
}

// Bookmark contains minimal details on a bookmarked item
type Bookmark struct {
	Pool       string            `json:"pool"` // this is the unique, internal pool name
	AddedAt    time.Time         `json:"addedAt"`
	Identifier string            `json:"identifier"`
	Details    map[string]string `json:"details"`
}

// ILSUserInfo contains ILS connector details for a user
type ILSUserInfo struct {
	ID                 string `json:"id"`
	DisplayName        string `xml:"displayName" json:"displayName"`
	Title              string `xml:"title" json:"title"`
	Profile            string `xml:"profile" json:"profile"`
	OrganizationalUnit string `xml:"organizationalUnit" json:"organizationalUnit"`
	Address            string `xml:"physicalDelivery" json:"address"`
	Email              string `xml:"email" json:"email"`
	TotalCheckouts     int    `xml:"totalCheckouts" json:"totalCheckouts"`
	TotalHolds         int    `xml:"totalHolds" json:"totalHolds"`
	TotalOverdue       int    `xml:"totalOverdue" json:"totalOverdue"`
	TotalRecalls       int    `xml:"totalRecalls" json:"totalRecalls"`
	TotalReserves      int    `xml:"totalReserves" json:"totalReserves"`
}

// User contains all user data collected from ILS and Virgo4 sources
type User struct {
	*ILSUserInfo
	AccessToken string                 `json:"acessToken"`
	Bookmarks   *map[string][]Bookmark `json:"bookmarks"`
}

// GetUser uses ILS Connector V2 API /users to get details for a user
func (svc *ServiceContext) GetUser(c *gin.Context) {
	userID := c.Param("id")
	log.Printf("Get info for user %s with ILS Connector...", userID)

	userURL := fmt.Sprintf("%s/users/%s", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	var ilsUser ILSUserInfo
	if err := xml.Unmarshal(bodyBytes, &ilsUser); err != nil {
		log.Printf("ERROR: unable to parse user response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	ilsUser.ID = userID

	log.Printf("Load other user settings from v4 internal data source")
	userSettings := NewUserSettings()
	q := svc.DB.NewQuery(`select * from users where virgo4_id={:id}`)
	q.Bind(dbx.Params{"id": userID})
	err := q.One(userSettings)
	if err != nil {
		log.Printf("ERROR: No v4 user settings found for %s: %+v", userID, err)
	} else {
		userSettings.GetBookmarks(svc.DB)
	}

	user := User{&ilsUser, userSettings.AuthToken, &userSettings.Bookmarks}
	c.JSON(http.StatusOK, user)
}

// AddBookmarkFolder will add a new blank folder for bookmarks
func (svc *ServiceContext) AddBookmarkFolder(c *gin.Context) {
	v4UserID := c.Param("id")
	var folder struct{ Name string }
	err := c.ShouldBindJSON(&folder)
	if err != nil {
		log.Printf("ERROR: invalid folder add payload: %v", err)
		c.String(http.StatusBadRequest, "Invalid add folder request")
		return
	}

	log.Printf("User %s adding bookmark folder %s", v4UserID, folder.Name)
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": v4UserID})
	var uid int
	uq.Row(&uid)

	q := svc.DB.NewQuery("insert into bookmark_folders (user_id, name) values ({:uid},{:name})")
	q.Bind(dbx.Params{"uid": uid})
	q.Bind(dbx.Params{"name": folder.Name})
	_, err = q.Execute()
	if err != nil {
		log.Printf("ERROR: add folder %s%s failed: %v", v4UserID, folder.Name, err)
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.String(http.StatusOK, "added %s", folder.Name)
}

// DeleteBookmarkFolder will remove a folder and all of its content
func (svc *ServiceContext) DeleteBookmarkFolder(c *gin.Context) {
	user := NewUserSettings()
	user.Virgo4ID = c.Param("id")
	folder := c.Query("name")
	log.Printf("User %s deleting bookmark folder %s", user.Virgo4ID, folder)

	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": user.Virgo4ID})
	uq.Row(&user.ID)

	q := svc.DB.NewQuery("delete from bookmark_folders where user_id={:uid} and name={:name}")
	q.Bind(dbx.Params{"uid": user.ID})
	q.Bind(dbx.Params{"name": folder})
	_, err := q.Execute()
	if err != nil {
		log.Printf("ERROR: unable to remove %s:%s - %v", user.Virgo4ID, folder, err)
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	// get updated bookmarks and return to user
	user.GetBookmarks(svc.DB)
	c.JSON(http.StatusOK, user.Bookmarks)
}

// AddBookmark will add a bookmark to a folder
func (svc *ServiceContext) AddBookmark(c *gin.Context) {
	user := NewUserSettings()
	user.Virgo4ID = c.Param("id")
	var item struct {
		Folder string
		Bookmark
	}
	err := c.ShouldBindJSON(&item)
	if err != nil {
		log.Printf("ERROR: invalid item add payload: %v", err)
		c.String(http.StatusBadRequest, "Invalid bookmark request")
		return
	}
	log.Printf("User %s adding bookmark %+v", user.Virgo4ID, item)

	// get user ID
	log.Printf("Lookup user %s ID", user.Virgo4ID)
	q := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	q.Bind(dbx.Params{"v4id": user.Virgo4ID})
	q.Row(&user.ID)

	// get folder ID
	log.Printf("Lookup folder %s ID", item.Folder)
	q = svc.DB.NewQuery("select id from bookmark_folders where name={:name}")
	q.Bind(dbx.Params{"name": item.Folder})
	var fid int
	err = q.Row(&fid)
	if err != nil {
		log.Printf("ERROR: User %s folder %s not found", user.Virgo4ID, item.Folder)
		c.String(http.StatusNotFound, "Folder %s not found", item.Folder)
		return
	}

	// get POOL ID
	log.Printf("Lookup pool %s ID", item.Pool)
	q = svc.DB.NewQuery("select id from sources where name={:name}")
	q.Bind(dbx.Params{"name": item.Pool})
	var pid int
	err = q.Row(&pid)
	if err != nil {
		log.Printf("ERROR: User %s pool %s not found", user.Virgo4ID, item.Pool)
		c.String(http.StatusNotFound, "Pool %s not found", item.Pool)
		return
	}

	q = svc.DB.NewQuery(`insert into bookmarks (user_id,folder_id,source_id,identifier,details,added_at)
		values ({:uid}, {:fid}, {:pid}, {:bid}, {:detail}, {:added})`)
	json, _ := json.Marshal(item.Bookmark.Details)
	q.Bind(dbx.Params{"uid": user.ID})
	q.Bind(dbx.Params{"fid": fid})
	q.Bind(dbx.Params{"pid": pid})
	q.Bind(dbx.Params{"bid": item.Identifier})
	q.Bind(dbx.Params{"detail": json})
	q.Bind(dbx.Params{"added": time.Now()})
	_, err = q.Execute()
	if err != nil {
		log.Printf("ERROR: User %s unable to add bookmark %+v: %v", user.Virgo4ID, item, err)
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	// get updated bookmarks and return to user
	user.GetBookmarks(svc.DB)
	c.JSON(http.StatusOK, user.Bookmarks)
}

// DeleteBookmark will remove bookmark from a folder
func (svc *ServiceContext) DeleteBookmark(c *gin.Context) {
	user := NewUserSettings()
	user.Virgo4ID = c.Param("id")
	bookmarkIdentifier := c.Query("identifier")
	log.Printf("User %s deleting bookmark %s", user.Virgo4ID, bookmarkIdentifier)

	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": user.Virgo4ID})
	uq.Row(&user.ID)

	q := svc.DB.NewQuery("delete from bookmarks where user_id={:uid} and identifier={:bid}")
	q.Bind(dbx.Params{"uid": user.ID})
	q.Bind(dbx.Params{"bid": bookmarkIdentifier})
	_, err := q.Execute()
	if err != nil {
		log.Printf("ERROR: unable to remove item %s:%s - %v", user.Virgo4ID, bookmarkIdentifier, err)
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	// Get the new list of bookmarks and return them as JSON
	user.GetBookmarks(svc.DB)
	c.JSON(http.StatusOK, user.Bookmarks)
}
