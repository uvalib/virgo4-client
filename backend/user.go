package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
)

// NewV4User creates a new instance of user settings with internal data initialzied
func NewV4User() *V4User {
	return &V4User{Bookmarks: make([]*Folder, 0, 0)}
}

// Folder contains details for a bookmark folder
type Folder struct {
	ID        int         `json:"id" db:"id"` // this is the unique DB key of the folder
	UserID    int         `json:"-" db:"user_id"`
	Name      string      `json:"folder" db:"name"`
	AddedAt   time.Time   `json:"addedAt" db:"added_at"`
	Bookmarks []*Bookmark `json:"bookmarks" db:"-"`
}

// TableName sets the name of the table in the DB that this struct binds to
func (u *Folder) TableName() string {
	return "bookmark_folders"
}

// Bookmark contains minimal details on a bookmarked item
type Bookmark struct {
	ID         int               `json:"id"`   // this is the unique DB key of the mark
	Pool       string            `json:"pool"` // this is the unique, internal pool name
	AddedAt    time.Time         `json:"addedAt"`
	Identifier string            `json:"identifier"`
	Details    map[string]string `json:"details"`
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

// GetBookmarks will load all folders and bookmarks for a user
func (u *V4User) GetBookmarks(db *dbx.DB) {
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

	// parse each bookmark row into the V4User structure
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
}

// ILSUserInfo contains ILS connector details for a user
type ILSUserInfo struct {
	ID          string `json:"id"`
	Barcode     string `json:"barcode"`
	DisplayName string `json:"displayName"`
	Title       string `json:"title"`
	Department  string `json:"department"`
	Description string `json:"description"`
	Profile     string `json:"profile"`
	Address     string `json:"address"`
	Email       string `json:"email"`
	Standing    string `json:"standing"`
}

// CheckoutInfo has sumary info for a checked out item
type CheckoutInfo struct {
	ID         int    `json:"id"`
	Title      string `json:"title"`
	Author     string `json:"author"`
	CallNumber string `json:"callNumber"`
	Library    string `json:"library"`
	DueDate    string `json:"due"`
}

// User contains all user data collected from ILS and Virgo4 sources
type User struct {
	UserInfo    *ILSUserInfo `json:"user"`
	AuthToken   string       `json:"authToken"`
	Bookmarks   []*Folder    `json:"bookmarks"`
	Preferences string       `json:"preferences"`
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

// AddBookmarkFolder will add a new blank folder for bookmarks
func (svc *ServiceContext) AddBookmarkFolder(c *gin.Context) {
	user := NewV4User()
	user.Virgo4ID = c.Param("uid")
	var fp struct{ Name string }
	err := c.ShouldBindJSON(&fp)
	if err != nil {
		log.Printf("ERROR: invalid folder add payload: %v", err)
		c.String(http.StatusBadRequest, "Invalid add folder request")
		return
	}

	log.Printf("User %s adding bookmark folder %s", user.Virgo4ID, fp.Name)
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": user.Virgo4ID})
	uq.Row(&user.ID)

	newFolder := Folder{UserID: user.ID, Name: fp.Name, AddedAt: time.Now()}
	err = svc.DB.Model(&newFolder).Insert()
	if err != nil {
		log.Printf("ERROR: add folder %s%s failed: %v", user.Virgo4ID, fp.Name, err)
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	// get updated bookmarks and return to user
	user.GetBookmarks(svc.DB)
	c.JSON(http.StatusOK, user.Bookmarks)
}

// DeleteBookmarkFolder will remove a folder and all of its content
func (svc *ServiceContext) DeleteBookmarkFolder(c *gin.Context) {
	user := NewV4User()
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
	user := NewV4User()
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
	folderObj := Folder{UserID: user.ID, Name: item.Folder}
	log.Printf("Lookup user %s folder %s", user.Virgo4ID, item.Folder)
	q = svc.DB.NewQuery("select * from bookmark_folders where name={:name} and user_id={:user}")
	q.Bind(dbx.Params{"name": item.Folder})
	q.Bind(dbx.Params{"user": user.ID})
	err = q.One(&folderObj)
	if err != nil {
		folderObj.AddedAt = time.Now()
		log.Printf("User %s folder %s not found; creating...", user.Virgo4ID, item.Folder)
		err := svc.DB.Model(&folderObj).Insert()
		if err != nil {
			log.Printf("ERROR: add folder %s%s failed: %v", user.Virgo4ID, folderObj.Name, err)
			c.String(http.StatusInternalServerError, err.Error())
			return
		}
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
	q.Bind(dbx.Params{"fid": folderObj.ID})
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
	user := NewV4User()
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
	user := NewV4User()
	user.Virgo4ID = c.Param("uid")
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": user.Virgo4ID})
	uq.Row(&user.ID)
	user.GetBookmarks(svc.DB)
	c.JSON(http.StatusOK, user.Bookmarks)
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
