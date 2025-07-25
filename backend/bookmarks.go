package main

import (
	"encoding/json"
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
	Sequence   uint      `json:"sequence"`
	UserID     int       `json:"-"`
	FolderID   int       `json:"folder_id"` // foreign key to the owning folder
	SourceID   int       `json:"-"`         // foreign key to source
	Source     Source    `gorm:"foreignKey:SourceID" json:"pool"`
	AddedAt    time.Time `json:"addedAt"`
	Identifier string    `json:"identifier"` // for items that are no longer available, identifier will be empty which blocks it from zotero
	Details    string    `json:"details"`
}

type bookmarkDetails struct {
	Title      string `json:"title"`
	Author     string `json:"author"`
	CallNumber string `json:"callNumber"`
	Format     string `json:"format"`
	Library    string `json:"library"`
}

func (d bookmarkDetails) equals(other bookmarkDetails) bool {
	return (d.Title == other.Title &&
		d.Author == other.Author &&
		d.CallNumber == other.CallNumber &&
		d.Format == other.Format &&
		d.Library == other.Library)
}

type bookmarkLookupResponse struct {
	SourceID int
	Details  bookmarkDetails
}

type itemField struct {
	Type      string `json:"type"`
	Name      string `json:"name"`
	Value     string `json:"value"`
	Separator string `json:"separator,omitempty"`
}

type itemDetails struct {
	Fields []itemField `json:"fields"`
}

func (svc *ServiceContext) preloadBookmarks() *gorm.DB {
	return svc.GDB.Preload("BookmarkFolders", func(db *gorm.DB) *gorm.DB {
		return db.Order("bookmark_folders.name ASC")
	}).Preload("BookmarkFolders.Bookmarks", func(db *gorm.DB) *gorm.DB {
		return db.Order("bookmarks.sequence, bookmarks.added_at ASC")
	}).Preload("BookmarkFolders.Bookmarks.Source")
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
	err = svc.GDB.Create(&newFolder).Error
	if err != nil {
		log.Printf("ERROR: user %s add folder %s failed: %s", v4UserID, fp.Name, err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	newFolder.Bookmarks = make([]Bookmark, 0)
	c.JSON(http.StatusOK, newFolder)
}

// PublishBookmarkFolder will move update a folder name
func (svc *ServiceContext) PublishBookmarkFolder(c *gin.Context) {
	uid := c.Param("uid")
	fid, _ := strconv.Atoi(c.Param("id"))
	log.Printf("User %s publish folder %d", uid, fid)
	svc.setFolderVisibility(c, fid, true)
}

// UnpublishBookmarkFolder will move update a folder name
func (svc *ServiceContext) UnpublishBookmarkFolder(c *gin.Context) {
	uid := c.Param("uid")
	fid, _ := strconv.Atoi(c.Param("id"))
	log.Printf("User %s unpublish folder %d", uid, fid)
	svc.setFolderVisibility(c, fid, false)
}

func (svc *ServiceContext) setFolderVisibility(c *gin.Context, folderID int, public bool) {
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

// UpdateBookmarkFolder will update a folder name
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

	folder, err := svc.getBookmarkFolder(folderID)
	if err != nil {
		log.Printf("ERROR: unable to load folder %s: %s", folderID, err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	folder.Name = updateInfo.Name
	err = svc.GDB.Model(&folder).Select("Name").Updates(folder).Error
	if err != nil {
		log.Printf("ERROR: unable to rename folder: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	c.JSON(http.StatusOK, folder)
}

func (svc *ServiceContext) getBookmarkFolder(folderID string) (*BookmarkFolder, error) {
	var folder BookmarkFolder
	bmErr := svc.GDB.Preload("Bookmarks", func(db *gorm.DB) *gorm.DB {
		return db.Order("bookmarks.sequence, bookmarks.id asc")
	}).Preload("Bookmarks.Source").Find(&folder, folderID).Error
	if bmErr != nil {
		return nil, bmErr
	}
	return &folder, nil
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
	var addRequest struct {
		Folder     string `json:"folder"`
		Pool       string `json:"pool"`
		Identifier string `json:"identifier"`
	}
	err := c.ShouldBindJSON(&addRequest)
	if err != nil {
		log.Printf("ERROR: user %s invalid item add bookmark payload: %s", v4UserID, err.Error())
		c.String(http.StatusBadRequest, "Invalid bookmark request")
		return
	}
	log.Printf("INFO: user %s:%d add bookmark %+v requested", v4UserID, userID, addRequest)

	jwtIface, _ := c.Get("jwt")
	jwt, _ := jwtIface.(string)
	bmData, luErr := svc.lookupBookmarkDetails(addRequest.Pool, addRequest.Identifier, jwt)
	if luErr != nil {
		log.Printf("ERROR: unable to get details for bookmark %s from pool %s: %s", addRequest.Identifier, addRequest.Pool, luErr.Error())
		c.String(http.StatusInternalServerError, luErr.Error())
		return
	}
	detailJSON, _ := json.Marshal(bmData.Details)

	log.Printf("INFO: lookup folder %s", addRequest.Folder)
	var folder BookmarkFolder
	resp := svc.GDB.Where("name=? and user_id=?", addRequest.Folder, userID).First(&folder)
	if resp.Error != nil {
		if errors.Is(resp.Error, gorm.ErrRecordNotFound) == false {
			log.Printf("ERROR: failed lookup for folder %s: %s", addRequest.Folder, resp.Error.Error())
			c.String(http.StatusInternalServerError, resp.Error.Error())
			return
		}
		log.Printf("INFO: user %s folder %s not found; creating...", v4UserID, addRequest.Folder)
		folder.Name = addRequest.Folder
		folder.AddedAt = time.Now()
		folder.UserID = userID
		addResp := svc.GDB.Create(&folder)
		if addResp.Error != nil {
			log.Printf("ERROR: user %s create folder %s failed: %s", v4UserID, addRequest.Folder, resp.Error.Error())
			c.String(http.StatusInternalServerError, addResp.Error.Error())
			return
		}
	}

	log.Printf("INFO: %s adding new bookmark to %s", v4UserID, addRequest.Folder)
	bm := Bookmark{UserID: userID, FolderID: folder.ID, SourceID: bmData.SourceID, AddedAt: time.Now(), Identifier: addRequest.Identifier, Details: string(detailJSON)}
	resp = svc.GDB.Create(&bm)
	if resp.Error != nil {
		log.Printf("ERROR: user %s unable to add bookmark %s: %s", v4UserID, addRequest.Identifier, resp.Error.Error())
		c.String(http.StatusInternalServerError, resp.Error.Error())
		return
	}

	var v4User User
	svc.preloadBookmarks().Find(&v4User, userID)
	c.JSON(http.StatusOK, v4User.BookmarkFolders)
}

func (svc *ServiceContext) lookupBookmarkDetails(pool, identifier, jwt string) (*bookmarkLookupResponse, error) {
	log.Printf("INFO: looking up source %s", pool)
	var source Source
	resp := svc.GDB.Where("name=?", pool).First(&source)
	if resp.Error != nil {
		return nil, fmt.Errorf("unable to find source %s: %s", pool, resp.Error.Error())
	}

	log.Printf("INFO: request details for %s:%s from %s", pool, identifier, source.PrivateURL)
	itemURL := fmt.Sprintf("%s/api/resource/%s", source.PrivateURL, identifier)
	rawResp, getErr := svc.PoolGet(itemURL, jwt)
	if getErr != nil {
		if getErr.StatusCode == 404 {
			return nil, fmt.Errorf("not found")
		}
		return nil, fmt.Errorf("%d: %s", getErr.StatusCode, getErr.Message)
	}

	// log.Printf("%s", rawResp)
	var item itemDetails
	err := json.Unmarshal(rawResp, &item)
	if err != nil {
		return nil, err
	}

	bmData := bookmarkDetails{}
	for _, field := range item.Fields {
		if field.Separator == "" {
			field.Separator = "; "
		}
		if field.Type == "title" {
			bmData.Title = field.Value
		} else if field.Name == "author" {
			if bmData.Author == "" {
				bmData.Author = field.Value
			} else {
				bmData.Author += fmt.Sprintf("%s%s", field.Separator, field.Value)
			}
		} else if field.Name == "format" {
			if bmData.Format == "" {
				bmData.Format = field.Value
			} else {
				bmData.Format += fmt.Sprintf("%s%s", field.Separator, field.Value)
			}
		} else if field.Name == "call_number" {
			if bmData.CallNumber == "" {
				bmData.CallNumber = field.Value
			} else {
				bmData.CallNumber += fmt.Sprintf("%s%s", field.Separator, field.Value)
			}
		} else if field.Name == "library" {
			if bmData.Library == "" {
				bmData.Library = field.Value
			} else {
				bmData.Library += fmt.Sprintf("%s%s", field.Separator, field.Value)
			}
		}
	}
	luResp := bookmarkLookupResponse{SourceID: source.ID, Details: bmData}
	return &luResp, nil
}

// ReorderBookmarks will update the seqence of all bookmarks in the target folder
func (svc *ServiceContext) ReorderBookmarks(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	folderID := c.Param("id")
	var params []struct {
		ID       uint `json:"id"`
		Sequence uint `json:"sequence"`
	}
	err := c.ShouldBindJSON(&params)
	if err != nil {
		log.Printf("INFO: bad payload for bookmark reorder request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	log.Printf("INFO: user %s:%d is reordering boolmarks in folder %s: %+v", v4UserID, userID, folderID, params)
	err = svc.GDB.Transaction(func(tx *gorm.DB) error {
		for _, bm := range params {
			seqErr := tx.Exec("update bookmarks set sequence=? where id=?", bm.Sequence, bm.ID).Error
			if seqErr != nil {
				return seqErr
			}
		}
		return nil
	})
	if err != nil {
		log.Printf("INFO: reorder request failed: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.String(http.StatusOK, "ok")
}

// RefreshBookmarks will refresh a list of bookmarks in a folder
func (svc *ServiceContext) RefreshBookmarks(c *gin.Context) {
	v4UserID := c.Param("uid")
	userID := c.GetInt("v4id")
	folderID := c.Param("id")
	log.Printf("INFO: user %s:%d refreshes all bookmarks in folder %s", v4UserID, userID, folderID)

	jwtIface, _ := c.Get("jwt")
	jwt, _ := jwtIface.(string)

	folder, err := svc.getBookmarkFolder(folderID)
	if err != nil {
		log.Printf("ERROR: unable to load folder %s: %s", folderID, err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	updated := 0
	missing := 0
	for _, bm := range folder.Bookmarks {
		log.Printf("INFO: begin refresh bookmark %s", bm.Identifier)
		refreshedBM, luErr := svc.lookupBookmarkDetails(bm.Source.Name, bm.Identifier, jwt)
		if luErr != nil {
			if strings.Contains(luErr.Error(), "not found") {
				// removing the identifier will block zotero from using this item and can be used
				// by the front end to give special treatment to the item
				log.Printf("INFO: bookmark %s details are no longer available", bm.Identifier)
				upErr := svc.GDB.Model(&bm).Update("identifier", "").Error
				if upErr != nil {
					log.Printf("ERROR: unable to update unavailable bookmark %s: %s", bm.Identifier, upErr.Error())
					continue
				}
				missing++
			} else {
				log.Printf("ERROR: unable to get details for bookmark %s from pool %s: %s", bm.Identifier, bm.Source.Name, luErr.Error())
			}
			continue
		}

		var currDetails bookmarkDetails
		json.Unmarshal([]byte(bm.Details), &currDetails)
		if currDetails.equals(refreshedBM.Details) == false {
			log.Printf("INFO: bookmark %s details have changed; updating record", bm.Identifier)
			refreshedDetails, _ := json.Marshal(refreshedBM.Details)
			upErr := svc.GDB.Model(&bm).Update("details", refreshedDetails).Error
			if upErr != nil {
				log.Printf("ERROR: unable to update bookmark %s details: %s", bm.Identifier, upErr.Error())
				continue
			}
			updated++
		} else {
			log.Printf("INFO: bookmark %s details are current; no update needed", bm.Identifier)
		}
	}
	log.Printf("INFO: %d bookmarks in folder %s processed: %d have been updated, %d are no longer available", len(folder.Bookmarks), folder.Name, updated, missing)

	folder, err = svc.getBookmarkFolder(folderID)
	if err != nil {
		log.Printf("ERROR: unable to load folder %s after refresh: %s", folderID, err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	resp := struct {
		Folder  *BookmarkFolder `json:"folder"`
		Total   int             `json:"count"`
		Updated int             `json:"updated"`
		Missing int             `json:"missing"`
	}{
		Folder:  folder,
		Total:   len(folder.Bookmarks),
		Updated: updated,
		Missing: missing,
	}
	c.JSON(http.StatusOK, resp)
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

	folder, err := svc.getBookmarkFolder(folderID)
	if err != nil {
		log.Printf("ERROR: unable to load folder %s after delete bookmarks: %s", folderID, err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
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
	resp := svc.GDB.Preload("Bookmarks", func(db *gorm.DB) *gorm.DB {
		return db.Order("bookmarks.sequence, bookmarks.added_at ASC")
	}).Preload("Bookmarks.Source").Where("is_public=? and token=?", true, token).First(&folder)
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
