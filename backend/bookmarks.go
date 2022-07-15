package main

import (
	"errors"
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

// Source defines search pool
type Source struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	PrivateURL string `json:"-"`
	PublicURL  string `json:"url"`
	Enabled    bool   `json:"-"`
	Sequence   int    `json:"-"`
}

// Bookmark contains minimal details on a bookmarked item
type Bookmark struct {
	ID         int       `json:"id"`
	UserID     int       `json:"-"`
	FolderID   int       `json:"folder_id"` // foreign key to the owning folder
	SourceID   int       `json:"-"`         // foreign key to source
	Source     Source    `gorm:"foreignKey:SourceID" json:"pool"`
	AddedAt    time.Time `json:"addedAt"`
	Identifier string    `json:"identifier"`
	Details    string    `json:"details"`
}

func (svc *ServiceContext) preloadBookmarks() *gorm.DB {
	return svc.GDB.Preload("BookmarkFolders", func(db *gorm.DB) *gorm.DB {
		return db.Order("bookmark_folders.name ASC")
	}).Preload("BookmarkFolders.Bookmarks").
		Preload("BookmarkFolders.Bookmarks.Source")
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
	resp := svc.GDB.Preload("Bookmarks").Preload("Bookmarks.Source").Find(&folder, folderID)
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
	userID := c.GetInt("v4id")
	v4UserID := c.Param("uid")
	var item struct {
		Folder     string
		Pool       string
		Identifier string
		Details    string
	}
	err := c.ShouldBindJSON(&item)
	if err != nil {
		log.Printf("ERROR: user %s invalid item add bookmark payload: %s", v4UserID, err.Error())
		c.String(http.StatusBadRequest, "Invalid bookmark request")
		return
	}
	log.Printf("INFO: user %s:%d add bookmark %+v requested", v4UserID, userID, item)

	log.Printf("INFO: looking up source %s", item.Pool)
	var source Source
	resp := svc.GDB.Where("name=?", item.Pool).First(&source)
	if resp.Error != nil {
		log.Printf("ERROR: unable to find source %s: %s", item.Pool, resp.Error.Error())
		c.String(http.StatusNotFound, "source %s not found", item.Pool)
		return
	}

	log.Printf("INFO: lookup folder %s", item.Folder)
	var folder BookmarkFolder
	resp = svc.GDB.Preload("Bookmarks").Where("name=? and user_id=?", item.Folder, userID).First(&folder)
	if resp.Error != nil {
		if errors.Is(resp.Error, gorm.ErrRecordNotFound) == false {
			log.Printf("ERROR: failed lookup for folder %s: %s", item.Folder, resp.Error.Error())
			c.String(http.StatusInternalServerError, resp.Error.Error())
			return
		}
		log.Printf("INFO: user %s folder %s not found; creating...", v4UserID, item.Folder)
		folder.Name = item.Folder
		folder.AddedAt = time.Now()
		folder.UserID = userID
		addResp := svc.GDB.Create(&folder)
		if addResp.Error != nil {
			log.Printf("ERROR: user %s create folder %s failed: %s", v4UserID, item.Folder, resp.Error.Error())
			c.String(http.StatusInternalServerError, addResp.Error.Error())
			return
		}
	}

	log.Printf("INFO: %s adding new bookmark to %s", v4UserID, item.Folder)
	bm := Bookmark{UserID: userID, FolderID: folder.ID, SourceID: source.ID, AddedAt: time.Now(), Identifier: item.Identifier, Details: item.Details}
	resp = svc.GDB.Create(&bm)
	if resp.Error != nil {
		log.Printf("ERROR: user %s unable to add bookmark %+v: %s", v4UserID, item, resp.Error.Error())
		c.String(http.StatusInternalServerError, resp.Error.Error())
		return
	}

	var v4User User
	svc.preloadBookmarks().Find(&v4User, userID)
	c.JSON(http.StatusOK, v4User.BookmarkFolders)
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
	svc.GDB.Preload("Bookmarks").Preload("Bookmarks.Source").Find(&folder, folderID)
	c.JSON(http.StatusOK, folder)
}

// ManageBookmarkStorage will copy/move seleceted bookmarks from the source folder to the destinations
func (svc *ServiceContext) ManageBookmarkStorage(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	log.Printf("User %s:%d manage bookmarks", v4UserID, userID)

	var req struct {
		SourceFolderID int
		DestFolderIDs  []int
		BookmarkIDs    []int
	}
	err := c.ShouldBindJSON(&req)
	if err != nil {
		log.Printf("ERROR: invalid manage bookmarks payload: %v", err)
		c.String(http.StatusBadRequest, fmt.Sprintf("Invalid request: %s", err.Error()))
		return
	}

	log.Printf("INFO: get bookmarks data for bookmarks %v", req.BookmarkIDs)
	var srcBookmarks []Bookmark
	err = svc.GDB.Find(&srcBookmarks, req.BookmarkIDs).Error
	if err != nil {
		log.Printf("ERROR: unable to get bookmarks %v: %s", req.BookmarkIDs, err.Error())
		c.String(http.StatusInternalServerError, fmt.Sprintf("Unable to retrieve source bookmarks: %s", err.Error()))
		return
	}

	removeOriginal := true
	for _, folderID := range req.DestFolderIDs {
		if folderID == req.SourceFolderID {
			removeOriginal = false
			break
		}
	}
	if removeOriginal {
		log.Printf("INFO: remove original version of bookmarks %v", req.BookmarkIDs)
		err = svc.GDB.Delete(&Bookmark{}, req.BookmarkIDs).Error
		if err != nil {
			log.Printf("ERROR: unable to remove bookmarks %v: %s", req.BookmarkIDs, err.Error())
			c.String(http.StatusInternalServerError, fmt.Sprintf("Unable to retrieve source bookmarks: %s", err.Error()))
			return
		}
	}

	log.Printf("INFO: add bookmarks to new folders")
	for _, bm := range srcBookmarks {
		for _, folderID := range req.DestFolderIDs {
			if folderID != bm.FolderID {
				var cnt int64
				svc.GDB.Model(Bookmark{}).Where("user_id=? and folder_id=? and identifier=?", userID, folderID, bm.Identifier).Count(&cnt)
				if cnt == 0 {
					bm.ID = 0
					bm.FolderID = folderID
					bm.AddedAt = time.Now()
					log.Printf("INFO: add %s to folderID %d", bm.Identifier, folderID)
					err = svc.GDB.Create(&bm).Error
					if err != nil {
						log.Printf("ERROR: add bookmark %+v failed: %s", bm, err.Error())
					}
				} else {
					log.Printf("INFO: folder %d already has bookmark %s; skipping copy/move", folderID, bm.Identifier)
				}
			}
		}
	}

	log.Printf("INFO: reload updated bookmarks")
	var v4User User
	svc.preloadBookmarks().Find(&v4User, userID)
	c.JSON(http.StatusOK, v4User.BookmarkFolders)
}

// GetPublicBookmarks returns shared bookmark data identified by the passed token
func (svc *ServiceContext) GetPublicBookmarks(c *gin.Context) {
	token := c.Param("token")
	log.Printf("INFO: get public bookmarks for %s", token)
	var folder BookmarkFolder
	resp := svc.GDB.Preload("Bookmarks").Preload("Bookmarks.Source").Where("is_public=? and token=?", true, token).First(&folder)
	if resp.Error != nil {
		log.Printf("INFO: public bookmarks %s not found: %s", token, resp.Error.Error())
		c.String(http.StatusNotFound, fmt.Sprintf("%s not found", token))
		return
	}
	c.JSON(http.StatusOK, folder)
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
