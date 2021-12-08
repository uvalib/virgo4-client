package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
	"github.com/rs/xid"
	"gorm.io/gorm"
)

// TODO FIX THIS ALOT

// BookmarkFolder contains details for a bookmark folder
type BookmarkFolder struct {
	ID        int        `json:"id"` // this is the unique DB key of the folder
	UserID    int        `json:"-"`
	Name      string     `json:"folder"`
	AddedAt   time.Time  `json:"addedAt"`
	IsPublic  bool       `json:"public"`
	Token     *string    `json:"token"`
	Bookmarks []Bookmark `json:"bookmarks" gorm:"foreignKey:FolderID"`
}

// Bookmark contains minimal details on a bookmarked item
type Bookmark struct {
	ID         int       `json:"id"`   // this is the unique DB key of the mark
	FolderID   int       `json:"-"`    // foreign key to the owning folder
	Pool       string    `json:"pool"` // this is the unique, internal pool name
	AddedAt    time.Time `json:"addedAt"`
	Identifier string    `json:"identifier"`
	Details    string    `json:"details"`
}

// AddBookmarkFolder will add a new blank folder for bookmarks
func (svc *ServiceContext) AddBookmarkFolder(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	var fp struct{ Name string }
	err := c.ShouldBindJSON(&fp)
	if err != nil {
		log.Printf("ERROR: invalid folder add payload: %s", err.Error())
		c.String(http.StatusBadRequest, "Invalid add folder request")
		return
	}
	log.Printf("User %s:%d adding bookmark folder %s", v4UserID, userID, fp.Name)

	newFolder := BookmarkFolder{UserID: userID, Name: fp.Name, AddedAt: time.Now()}
	resp := svc.GDB.Create(&newFolder)
	if resp.Error != nil {
		log.Printf("ERROR: user %s add folder %s failed: %s", v4UserID, fp.Name, resp.Error.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	newFolder.Bookmarks = make([]Bookmark, 0)
	c.JSON(http.StatusOK, newFolder)
}

// PublishBookmarkFolder will move update a folder name
func (svc *ServiceContext) PublishBookmarkFolder(c *gin.Context) {
	uid := c.Param("uid")
	userID := c.GetInt("v4id")
	fid, _ := strconv.Atoi(c.Param("id"))
	log.Printf("User %s publish folder %d", uid, fid)
	svc.setFolderVisibility(c, userID, fid, true)
}

// UnpublishBookmarkFolder will move update a folder name
func (svc *ServiceContext) UnpublishBookmarkFolder(c *gin.Context) {
	uid := c.Param("uid")
	userID := c.GetInt("v4id")
	fid, _ := strconv.Atoi(c.Param("id"))
	log.Printf("User %s unpublish folder %d", uid, fid)
	svc.setFolderVisibility(c, userID, fid, false)
}

func (svc *ServiceContext) setFolderVisibility(c *gin.Context, uid int, folderID int, public bool) {
	var folder BookmarkFolder
	resp := svc.GDB.Find(&folder, folderID)
	if resp.Error != nil {
		log.Printf("Folder %d not found: %s", folderID, resp.Error.Error())
		c.String(http.StatusNotFound, "folder not found")
		return
	}

	folder.IsPublic = public
	if public {
		tok := xid.New().String()
		folder.Token = &tok
	}

	resp = svc.GDB.Model(&folder).Select("IsPublic", "Token").Updates(folder)
	if resp.Error != nil {
		c.String(http.StatusInternalServerError, resp.Error.Error())
		return
	}
	if public {
		c.String(http.StatusOK, *folder.Token)
		return
	}
	c.String(http.StatusOK, "ok")
}

// UpdateBookmarkFolder will move update a folder name
func (svc *ServiceContext) UpdateBookmarkFolder(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	folderID := c.Param("id")

	var updateInfo struct{ Name string }
	err := c.ShouldBindJSON(&updateInfo)
	if err != nil {
		log.Printf("ERROR: invalid folder rename payload: %v", err)
		c.String(http.StatusBadRequest, "Invalid rename folder request")
		return
	}
	log.Printf("User %s:%d updating folderID %s name to %s", v4UserID, userID, folderID, updateInfo.Name)

	var folder BookmarkFolder
	resp := svc.GDB.Preload("Bookmarks").Find(&folder, folderID)
	if resp.Error != nil {
		log.Printf("Folder %s not found: %s", folderID, resp.Error.Error())
		c.String(http.StatusNotFound, "folder not found")
		return
	}

	folder.Name = updateInfo.Name
	resp = svc.GDB.Model(&folder).Select("Name").Updates(folder)
	if resp.Error != nil {
		log.Printf("ERROR: unable to rename folder: %s", resp.Error.Error())
		c.String(http.StatusBadRequest, resp.Error.Error())
		return
	}

	c.JSON(http.StatusOK, folder)
}

// DeleteBookmarkFolder will remove a folder and all of its content
func (svc *ServiceContext) DeleteBookmarkFolder(c *gin.Context) {
	userID := c.GetInt("v4id")
	v4UserID := c.Param("uid")
	folderID := c.Param("id")
	log.Printf("INFO: user %s:%d deleting bookmark folder %s", v4UserID, userID, folderID)

	var folder BookmarkFolder
	resp := svc.GDB.Find(&folder, folderID)
	if resp.Error != nil {
		log.Printf("ERROR: folder %s not found: %s", folderID, resp.Error.Error())
		c.String(http.StatusNotFound, "folder not found")
		return
	}
	svc.GDB.Delete(&folder)
	c.String(http.StatusOK, "deleted")
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
	folderObj := BookmarkFolder{UserID: user.ID, Name: item.Folder}
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

	log.Printf("Adding bew bookmark")
	q = svc.DB.NewQuery(`insert into bookmarks (user_id,folder_id,source_id,identifier,details,added_at)
		values ({:uid}, {:fid}, {:pid}, {:bid}, {:detail}, {:added})`)
	q.Bind(dbx.Params{"uid": user.ID})
	q.Bind(dbx.Params{"fid": folderObj.ID})
	q.Bind(dbx.Params{"pid": pid})
	q.Bind(dbx.Params{"bid": item.Identifier})
	q.Bind(dbx.Params{"detail": item.Details})
	q.Bind(dbx.Params{"added": time.Now()})
	_, err = q.Execute()
	if err != nil {
		log.Printf("ERROR: User %s unable to add bookmark %+v: %v", user.Virgo4ID, item, err)
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	// get updated bookmarks and return to user
	// user.GetBookmarks(svc.DB) TODO
	c.JSON(http.StatusOK, user.BookmarkFolders)
}

// DeleteBookmarks will remove a list of bookmarks from a folder
func (svc *ServiceContext) DeleteBookmarks(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	folderID := c.Param("id")
	var params struct {
		BookmarkIDs []int
	}
	c.ShouldBindJSON(&params)
	log.Printf("INFO: user %s:%d deleting folder %s bookmarks %v", v4UserID, userID, folderID, params.BookmarkIDs)

	qStr := fmt.Sprintf("delete from bookmarks where user_id=%d and id in (%s)",
		userID, sqlIntSeq(params.BookmarkIDs))
	resp := svc.GDB.Exec(qStr)
	if resp.Error != nil {
		log.Printf("ERROR: unable to remove bookmarks %s:%v - %s",
			v4UserID, params.BookmarkIDs, resp.Error.Error())
		c.String(http.StatusInternalServerError, resp.Error.Error())
		return
	}

	var folder BookmarkFolder
	svc.GDB.Preload("Bookmarks").Find(&folder, folderID)
	c.JSON(http.StatusOK, folder)
}

// MoveBookmarks will move a list bookmarks to a new folder
func (svc *ServiceContext) MoveBookmarks(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	log.Printf("User %s:%d moving bookmarks", v4UserID, userID)

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

	rawQ := fmt.Sprintf("update bookmarks set folder_id=%d where id in (%s)",
		moveInfo.FolderID, sqlIntSeq(moveInfo.BookmarkIDs))
	resp := svc.GDB.Exec(rawQ)
	if resp.Error != nil {
		log.Printf("ERROR: unable to move bookmarks: %s", resp.Error.Error())
		c.String(http.StatusInternalServerError, resp.Error.Error())
		return
	}

	var v4User User
	svc.GDB.Preload("BookmarkFolders", func(db *gorm.DB) *gorm.DB {
		return db.Order("bookmark_folders.name ASC")
	}).Preload("BookmarkFolders.Bookmarks").Find(&v4User, userID)

	c.JSON(http.StatusOK, v4User.BookmarkFolders)
}

// GetPublicBookmarks returns shared bookmark data identified by the passed token
func (svc *ServiceContext) GetPublicBookmarks(c *gin.Context) {
	token := c.Param("token")
	log.Printf("Get public bookmarks for %s", token)
	q := svc.DB.NewQuery(`SELECT name from bookmark_folders where token={:tok}`)
	q.Bind(dbx.Params{"tok": token})
	var out struct {
		FolderName string     `json:"folder"`
		Bookmarks  []Bookmark `json:"bookmarks"`
	}

	err := q.Row(&out.FolderName)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("INFO: token %s not found", token)
			c.String(http.StatusNotFound, fmt.Sprintf("token %s not found", token))
		} else {
			log.Printf("ERROR: unaable to get token %s: %s", token, err.Error())
			c.String(http.StatusInternalServerError, err.Error())
		}
		return
	}
	q = svc.DB.NewQuery(`SELECT b.*, s.name as pool
	 	FROM bookmark_folders f
			LEFT JOIN bookmarks b ON b.folder_id=f.id
			LEFT JOIN sources s ON s.id = b.source_id
		WHERE f.token={:tok} ORDER BY b.added_at ASC`)
	q.Bind(dbx.Params{"tok": token})
	rows, err := q.Rows()
	if err != nil {
		log.Printf("Unable to get bookmarks from %s:%v", token, err)
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}

	// parse each bookmark row into the V4User structure
	out.Bookmarks = make([]Bookmark, 0)
	for rows.Next() {
		var bm Bookmark
		rows.ScanStruct(&bm)
		out.Bookmarks = append(out.Bookmarks, bm)
	}

	c.JSON(http.StatusOK, out)
}

func sqlIntSeq(ns []int) string {
	if len(ns) == 0 {
		return ""
	}
	out := make([]string, 0)
	for _, seq := range ns {
		out = append(out, fmt.Sprintf("%d", seq))
	}
	return strings.Join(out, ",")
}
