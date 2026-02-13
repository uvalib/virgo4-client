package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetPreferences returns the latests preferences for a user
func (svc *ServiceContext) GetPreferences(c *gin.Context) {
	v4UserID := c.Param("uid")
	var user User
	dbResp := svc.GDB.Where("virgo4_id=?", v4UserID).Select("preferences").Find(&user)
	if dbResp.Error != nil {
		if errors.Is(dbResp.Error, gorm.ErrRecordNotFound) {
			log.Printf("INFO: preferences request for user %s not found", v4UserID)
			c.String(http.StatusNotFound, fmt.Sprintf("%s not found", v4UserID))
			return
		}
		log.Printf("ERROR: preferences request for user %s failed: %s", v4UserID, dbResp.Error.Error())
		c.String(http.StatusInternalServerError, dbResp.Error.Error())
		return
	}

	c.JSON(http.StatusOK, user.Preferences)
}

// SavePreferences will save a block of JSON preference data to the user table
func (svc *ServiceContext) SavePreferences(c *gin.Context) {
	userID := c.GetInt("v4id")
	v4UserID := c.Param("uid")
	var prefs any
	err := c.ShouldBindJSON(&prefs)
	if err != nil {
		log.Printf("ERROR: unable to get preference data from %s[%d]: %s", v4UserID, userID, err)
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	log.Printf("INFO: %s[%d] requests preference update %+v", v4UserID, userID, prefs)

	// Data is good. Back to JSON string and save...
	jsonPrefs, _ := json.Marshal(prefs)
	v4User := User{ID: userID, Virgo4ID: v4UserID, Preferences: string(jsonPrefs)}
	dbErr := svc.GDB.Model(&v4User).Select("Preferences").Updates(v4User)
	if dbErr.Error != nil {
		log.Printf("ERROR: unable to save preference data for %s[%d]: %s", v4UserID, userID, dbErr.Error)
		c.String(http.StatusBadRequest, dbErr.Error.Error())
		return
	}

	c.String(http.StatusOK, "OK")
}
