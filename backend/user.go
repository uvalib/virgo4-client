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
	return &UserSettings{Bookmarks: make([]*Folder, 0, 0)}
}

// Folder contains details for a bookmark folder
type Folder struct {
	ID        int         `json:"id" db:"id"` // this is the unique DB key of the folder
	Name      string      `json:"folder" db:"name"`
	AddedAt   time.Time   `json:"addedAt" db:"added_at"`
	Bookmarks []*Bookmark `json:"bookmarks" db:"-"`
}

// Bookmark contains minimal details on a bookmarked item
type Bookmark struct {
	ID         int               `json:"id"`   // this is the unique DB key of the mark
	Pool       string            `json:"pool"` // this is the unique, internal pool name
	AddedAt    time.Time         `json:"addedAt"`
	Identifier string            `json:"identifier"`
	Details    map[string]string `json:"details"`
}

// UserSettings contains virgo4 user data like session token, bookmarks and preferences
type UserSettings struct {
	ID            int       `db:"id" json:"-"`
	Virgo4ID      string    `db:"virgo4_id" json:"id"`
	AuthToken     string    `db:"auth_token" json:"-"`
	AuthUpdatedAt time.Time `db:"auth_updated_at" json:"-"`
	SignedIn      bool      `db:"signed_in" json:"-"`
	Bookmarks     []*Folder `db:"-" json:"bookmarks"`
}

// TableName sets the name of the table in the DB that this struct binds to
func (u *UserSettings) TableName() string {
	return "users"
}

// GetBookmarks will load all folders and bookmarks for a user
func (u *UserSettings) GetBookmarks(db *dbx.DB) {
	log.Printf("Load bookmarks for %s", u.Virgo4ID)
	q := db.NewQuery(`SELECT f.id as f_id, f.name as folder, b.added_at as f_added_at,
	   s.name as pool, b.id as b_id, b.identifier, b.details, b.added_at as b_added_at
	 	FROM bookmark_folders f  
			LEFT JOIN bookmarks b ON b.folder_id=f.id
			LEFT JOIN sources s ON s.id = b.source_id 
		WHERE f.user_id={:id} ORDER BY b.added_at ASC`)
	q.Bind(dbx.Params{"id": u.ID})
	rows, err := q.Rows()
	if err != nil {
		log.Printf("Unable to get bookmarks for %s:%v", u.Virgo4ID, err)
		return
	}

	// parse each bookmark row into the UserSettings structure
	for rows.Next() {
		var raw struct {
			BookmarkID    int       `db:"b_id"`
			FolderID      int       `db:"f_id"`
			FolderAddedAt time.Time `db:"f_added_at"`
			Folder        string    `db:"folder"`
			Pool          string    `db:"pool"`
			Identifier    string    `db:"identifier"`
			Details       string    `db:"details"`
			AddedAt       time.Time `db:"b_added_at"`
		}
		rows.ScanStruct(&raw)
		var tgtFolder *Folder
		for _, folder := range u.Bookmarks {
			if folder.ID == raw.FolderID {
				tgtFolder = folder
			}
		}
		if tgtFolder == nil {
			newFolder := Folder{ID: raw.FolderID, Name: raw.Folder, AddedAt: raw.FolderAddedAt}
			newFolder.Bookmarks = make([]*Bookmark, 0)
			u.Bookmarks = append(u.Bookmarks, &newFolder)
			tgtFolder = &newFolder
			log.Printf("New Folder %+v", newFolder)
		}

		if raw.Identifier != "" {
			bookmark := Bookmark{ID: raw.BookmarkID, Pool: raw.Pool,
				Identifier: raw.Identifier, AddedAt: raw.AddedAt}
			err := json.Unmarshal([]byte(raw.Details), &bookmark.Details)
			if err != nil {
				log.Printf("Unable to parse bookmark data %s: %v", raw.Details, err)
			} else {
				tgtFolder.Bookmarks = append(tgtFolder.Bookmarks, &bookmark)
			}
		}
	}
	log.Printf("BOOKMARKS %+v", u.Bookmarks)
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
	UserInfo  *ILSUserInfo `json:"user"`
	AuthToken string       `json:"authToken"`
	Bookmarks []*Folder    `json:"bookmarks"`
}

// GetUser uses ILS Connector V2 API /users to get details for a user
func (svc *ServiceContext) GetUser(c *gin.Context) {
	userID := c.Param("uid")
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

	user := User{UserInfo: &ilsUser,
		AuthToken: userSettings.AuthToken,
		Bookmarks: userSettings.Bookmarks}
	c.JSON(http.StatusOK, user)
}

// AddBookmarkFolder will add a new blank folder for bookmarks
func (svc *ServiceContext) AddBookmarkFolder(c *gin.Context) {
	user := NewUserSettings()
	user.Virgo4ID = c.Param("uid")
	var folder struct{ Name string }
	err := c.ShouldBindJSON(&folder)
	if err != nil {
		log.Printf("ERROR: invalid folder add payload: %v", err)
		c.String(http.StatusBadRequest, "Invalid add folder request")
		return
	}

	log.Printf("User %s adding bookmark folder %s", user.Virgo4ID, folder.Name)
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": user.Virgo4ID})
	uq.Row(&user.ID)

	q := svc.DB.NewQuery("insert into bookmark_folders (user_id, name) values ({:uid},{:name})")
	q.Bind(dbx.Params{"uid": user.ID})
	q.Bind(dbx.Params{"name": folder.Name})
	_, err = q.Execute()
	if err != nil {
		log.Printf("ERROR: add folder %s%s failed: %v", user.Virgo4ID, folder.Name, err)
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	// get updated bookmarks and return to user
	user.GetBookmarks(svc.DB)
	c.JSON(http.StatusOK, user.Bookmarks)
}

// DeleteBookmarkFolder will remove a folder and all of its content
func (svc *ServiceContext) DeleteBookmarkFolder(c *gin.Context) {
	user := NewUserSettings()
	user.Virgo4ID = c.Param("uid")
	folderID := c.Param("id")
	log.Printf("User %s deleting bookmark folder %s", user.Virgo4ID, folderID)

	q := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	q.Bind(dbx.Params{"v4id": user.Virgo4ID})
	q.Row(&user.ID)

	q = svc.DB.NewQuery("delete from bookmark_folders where user_id={:uid} and id={:fid}")
	q.Bind(dbx.Params{"uid": user.ID})
	q.Bind(dbx.Params{"fid": folderID})
	_, err := q.Execute()
	if err != nil {
		log.Printf("ERROR: unable to remove %s:%s - %v", user.Virgo4ID, folderID, err)
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
	user.Virgo4ID = c.Param("uid")
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

// DeleteBookmark will remove a bookmark by internal DB identifier
func (svc *ServiceContext) DeleteBookmark(c *gin.Context) {
	user := NewUserSettings()
	user.Virgo4ID = c.Param("uid")
	bookmarkID := c.Param("id")
	log.Printf("User %s deleting bookmarkID %s", user.Virgo4ID, bookmarkID)

	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": user.Virgo4ID})
	uq.Row(&user.ID)

	qStr := "delete from bookmarks where user_id={:uid} and id={:bid}"
	q := svc.DB.NewQuery(qStr)
	q.Bind(dbx.Params{"uid": user.ID})
	q.Bind(dbx.Params{"bid": bookmarkID})

	_, err := q.Execute()
	if err != nil {
		log.Printf("ERROR: unable to remove item %s:%s - %v", user.Virgo4ID, bookmarkID, err)
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	// Get the new list of bookmarks and return them as JSON
	user.GetBookmarks(svc.DB)
	c.JSON(http.StatusOK, user.Bookmarks)
}

// GetBookmarks returns bookmark data for the specified user
func (svc *ServiceContext) GetBookmarks(c *gin.Context) {
	user := NewUserSettings()
	user.Virgo4ID = c.Param("uid")
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": user.Virgo4ID})
	uq.Row(&user.ID)
	user.GetBookmarks(svc.DB)
	c.JSON(http.StatusOK, user.Bookmarks)
}
