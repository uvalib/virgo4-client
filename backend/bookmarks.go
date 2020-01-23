package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
	"github.com/rs/xid"
)

// Folder contains details for a bookmark folder
type Folder struct {
	ID        int         `json:"id" db:"id"` // this is the unique DB key of the folder
	UserID    int         `json:"-" db:"user_id"`
	Name      string      `json:"folder" db:"name"`
	AddedAt   time.Time   `json:"addedAt" db:"added_at"`
	Public    bool        `json:"public" db:"is_public"`
	Token     *string     `json:"token" db:"token"`
	Bookmarks []*Bookmark `json:"bookmarks" db:"-"`
}

// TableName sets the name of the table in the DB that this struct binds to
func (f Folder) TableName() string {
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

// GetBookmarks will load all folders and bookmarks for a user
func (u *V4User) GetBookmarks(db *dbx.DB) {
	log.Printf("Load bookmarks for %s", u.Virgo4ID)
	q := db.NewQuery(`SELECT f.id as f_id, f.name as folder, b.added_at as f_added_at,
		f.is_public as is_public, f.token as pub_token,
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
			Public        bool      `db:"is_public"`
			Token         string    `db:"pub_token"`
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
			newFolder := Folder{ID: raw.FolderID, Name: raw.Folder, AddedAt: raw.FolderAddedAt,
				Public: raw.Public, Token: &raw.Token}
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

	exist := 0
	fq := svc.DB.NewQuery("select count(*) from bookmark_folders where user_id={:uid} and name={:fn}")
	fq.Bind(dbx.Params{"uid": user.ID})
	fq.Bind(dbx.Params{"fn": fp.Name})
	fq.Row(&exist)
	if exist != 0 {
		log.Printf("ERROR: add folder %s:%s already exists", user.Virgo4ID, fp.Name)
		c.String(http.StatusConflict, "Folder '%s' already exists", fp.Name)
		return
	}

	newFolder := Folder{UserID: user.ID, Name: fp.Name, AddedAt: time.Now()}
	err = svc.DB.Model(&newFolder).Insert()
	if err != nil {
		log.Printf("ERROR: add folder %s%s failed: %v", user.Virgo4ID, fp.Name, err)
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	// get updated bookmarks and return to user
	user.GetBookmarks(svc.DB)
	c.JSON(http.StatusOK, user.Bookmarks)
}

// PublishBookmarkFolder will move update a folder name
func (svc *ServiceContext) PublishBookmarkFolder(c *gin.Context) {
	uid := c.Param("uid")
	fid, _ := strconv.Atoi(c.Param("id"))
	log.Printf("User %s publish folder%d", uid, fid)
	svc.setFolderVisibility(c, uid, fid, true)
}

// UnpublishBookmarkFolder will move update a folder name
func (svc *ServiceContext) UnpublishBookmarkFolder(c *gin.Context) {
	uid := c.Param("uid")
	fid, _ := strconv.Atoi(c.Param("id"))
	log.Printf("User %s unpublish folder%d", uid, fid)
	svc.setFolderVisibility(c, uid, fid, false)
}

func (svc *ServiceContext) setFolderVisibility(c *gin.Context, uid string, folderID int, public bool) {
	var userID int
	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": uid})
	uErr := uq.Row(&userID)
	if uErr != nil {
		log.Printf("ERROR: couldn't find user %s: %v", uid, uErr)
		c.String(http.StatusBadRequest, "Invalid user %s", uid)
		return
	}

	var folder Folder
	err := svc.DB.Select().Where(dbx.HashExp{"id": folderID, "user_id": userID}).One(&folder)
	if err != nil {
		log.Printf("Folder %d not found: %+v", folderID, err)
		c.String(http.StatusNotFound, "folder not found")
		return
	}

	folder.Public = public
	if public {
		tok := xid.New().String()
		folder.Token = &tok
	}

	err = svc.DB.Model(&folder).Update()
	if err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.String(http.StatusOK, "ok")
}

// UpdateBookmarkFolder will move update a folder name
func (svc *ServiceContext) UpdateBookmarkFolder(c *gin.Context) {
	user := NewV4User()
	user.Virgo4ID = c.Param("uid")
	folderID := c.Param("id")
	log.Printf("User %s updating folderID %s", user.Virgo4ID, folderID)

	// get user ID
	log.Printf("Lookup user %s ID", user.Virgo4ID)
	q := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	q.Bind(dbx.Params{"v4id": user.Virgo4ID})
	q.Row(&user.ID)

	var folderInfo struct {
		Name string
	}
	err := c.ShouldBindJSON(&folderInfo)
	if err != nil {
		log.Printf("ERROR: invalid folder rename payload: %v", err)
		c.String(http.StatusBadRequest, "Invalid rename folder request")
		return
	}

	uq := svc.DB.NewQuery("update bookmark_folders set name={:fn} where id={:fid}")
	uq.Bind(dbx.Params{"fn": folderInfo.Name})
	uq.Bind(dbx.Params{"fid": folderID})
	_, err = uq.Execute()
	if err != nil {
		log.Printf("ERROR: unable to rename folder: %s", err)
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	// Get the new list of bookmarks and return them as JSON
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

// DeleteBookmarks will remove a list of bookmarks
func (svc *ServiceContext) DeleteBookmarks(c *gin.Context) {
	user := NewV4User()
	user.Virgo4ID = c.Param("uid")
	var params struct {
		BookmarkIDs []int
	}
	c.ShouldBindJSON(&params)
	log.Printf("User %s deleting bookmarks %v", user.Virgo4ID, params.BookmarkIDs)

	uq := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	uq.Bind(dbx.Params{"v4id": user.Virgo4ID})
	uq.Row(&user.ID)

	qStr := fmt.Sprintf("delete from bookmarks where user_id={:uid} and id in (%s)",
		sqlIntSeq(params.BookmarkIDs))
	q := svc.DB.NewQuery(qStr)
	q.Bind(dbx.Params{"uid": user.ID})

	_, err := q.Execute()
	if err != nil {
		log.Printf("ERROR: unable to remove bookmarks %s:%v - %v",
			user.Virgo4ID, params.BookmarkIDs, err)
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	// Get the new list of bookmarks and return them as JSON
	user.GetBookmarks(svc.DB)
	c.JSON(http.StatusOK, user.Bookmarks)
}

// MoveBookmarks will move a list bookmarks to a new folder
func (svc *ServiceContext) MoveBookmarks(c *gin.Context) {
	user := NewV4User()
	user.Virgo4ID = c.Param("uid")
	log.Printf("User %s moving bookmarks", user.Virgo4ID)

	// get user ID
	log.Printf("Lookup user %s ID", user.Virgo4ID)
	q := svc.DB.NewQuery("select id from users where virgo4_id={:v4id}")
	q.Bind(dbx.Params{"v4id": user.Virgo4ID})
	q.Row(&user.ID)

	var moveInfo struct {
		FolderID    int
		BookmarkIDs []int
	}
	err := c.ShouldBindJSON(&moveInfo)
	if err != nil {
		log.Printf("ERROR: invalid item move payload: %v", err)
		c.String(http.StatusBadRequest, "Invalid move bookmark request")
		return
	}

	rawQ := fmt.Sprintf("update bookmarks set folder_id={:fid} where id in (%s)",
		sqlIntSeq(moveInfo.BookmarkIDs))
	uq := svc.DB.NewQuery(rawQ)
	uq.Bind(dbx.Params{"fid": moveInfo.FolderID})
	_, err = uq.Execute()
	if err != nil {
		log.Printf("ERROR: unable to move bookmarks: %s", err)
		c.String(http.StatusBadRequest, err.Error())
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

func sqlIntSeq(ns []int) string {
	if len(ns) == 0 {
		return ""
	}

	// Appr. 3 chars per num plus the comma.
	estimate := len(ns) * 4
	b := make([]byte, 0, estimate)
	// Or simply
	//   b := []byte{}
	for _, n := range ns {
		b = strconv.AppendInt(b, int64(n), 10)
		b = append(b, ',')
	}
	b = b[:len(b)-1]
	return string(b)
}
