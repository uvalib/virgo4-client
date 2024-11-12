package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type pickupLibrary struct {
	ID      int    `json:"primaryKey"`
	Key     string `json:"id"`
	Name    string `json:"name"`
	URL     string `json:"url"`
	Enabled bool   `json:"enabled"`
}

// UpdatePickupLibrary updates key/name/enabled for the given library
func (svc *ServiceContext) UpdatePickupLibrary(c *gin.Context) {
	id := c.Param("id")
	log.Printf("INFO: update pickup library %s", id)
	var plReq pickupLibrary
	err := c.ShouldBindJSON(&plReq)
	if err != nil {
		log.Printf("ERROR: invalid update pickup library payload: %s", err.Error())
		c.String(http.StatusBadRequest, "Invalid update pickup library request")
		return
	}

	var origReq pickupLibrary
	dbErr := svc.GDB.First(&origReq, plReq.ID).Error
	if dbErr != nil {
		log.Printf("ERROR: unable to load pickuplibraray %d: %s", plReq.ID, dbErr.Error())
		c.String(http.StatusBadRequest, fmt.Sprintf("unable to load pickup library %d details: %s", plReq.ID, dbErr.Error()))
		return
	}

	dbErr = svc.GDB.Save(&plReq).Error
	if dbErr != nil {
		log.Printf("ERROR: unable to update pickup library %s: %s", id, dbErr.Error())
		c.String(http.StatusInternalServerError, dbErr.Error())
		return
	}

	if plReq.Enabled == false && origReq.Enabled == true {
		log.Printf("INFO: %s has been disabled; remove it from user preferences", plReq.Key)
		svc.removePickupLibraryPreferences(plReq.Key)
	}

	c.JSON(http.StatusOK, plReq)
}

// AddPickupLibrary adds a new library to the pickup library list
func (svc *ServiceContext) AddPickupLibrary(c *gin.Context) {
	var plReq pickupLibrary
	err := c.ShouldBindJSON(&plReq)
	if err != nil {
		log.Printf("ERROR: invalid update pickup library payload: %s", err.Error())
		c.String(http.StatusBadRequest, "Invalid update pickup library request")
		return
	}
	log.Printf("INFO: create new pickup library: %+v", plReq)

	dbErr := svc.GDB.Create(&plReq).Error
	if dbErr != nil {
		log.Printf("ERROR: unable to create pickup library: %s", dbErr.Error())
		c.String(http.StatusInternalServerError, dbErr.Error())
		return
	}

	c.JSON(http.StatusOK, plReq)
}

// DeletePickupLibrary removes a  library to the pickup library list
func (svc *ServiceContext) DeletePickupLibrary(c *gin.Context) {
	id := c.Param("id")
	log.Printf("INFO: delete pickup library %s", id)
	dbErr := svc.GDB.Delete(&pickupLibrary{}, id).Error
	if dbErr != nil {
		log.Printf("ERROR: unable to delete pickup library: %s", dbErr.Error())
		c.String(http.StatusInternalServerError, dbErr.Error())
		return
	}

	svc.removePickupLibraryPreferences(id)

	c.String(http.StatusOK, "deleted")
}

func (svc *ServiceContext) removePickupLibraryPreferences(pickupLibraryID string) {
	log.Printf("INFO: remove disabled/deleted pickup library %s from all user preferences", pickupLibraryID)
	var users []User
	dbResp := svc.GDB.Raw("select id,(preferences-'pickupLibrary') as preferences from users where preferences->'pickupLibrary'->>'id' = ?", pickupLibraryID).Scan(&users)
	if dbResp.Error != nil {
		log.Printf("ERROR: unable to get user pickup library preferences: %s", dbResp.Error.Error())
	} else {
		log.Printf("INFO: updating preferences for %d users", len(users))
		for _, u := range users {
			dbResp = svc.GDB.Model(&u).Select("Preferences").Updates(u)
			if dbResp.Error != nil {
				log.Printf("ERROR: unable to update user %d preferences: %s", u.ID, dbResp.Error.Error())
			}
		}
	}
}
