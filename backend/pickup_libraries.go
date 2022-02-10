package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type pickupLibrary struct {
	ID      int    `json:"primaryKey"`
	Key     string `json:"id"`
	Name    string `json:"name"`
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

	dbResp := svc.GDB.Debug().Model(&plReq).Select("Key", "Name", "Enabled").Updates(plReq)
	if dbResp.Error != nil {
		log.Printf("ERROR: unable to update pickup library %s: %s", id, dbResp.Error.Error())
		c.String(http.StatusInternalServerError, dbResp.Error.Error())
		return
	}

	log.Printf("INFO: pickup library updated: %+v", plReq)

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

	dbResp := svc.GDB.Create(&plReq)
	if dbResp.Error != nil {
		log.Printf("ERROR: unable to create pickup library: %s", dbResp.Error.Error())
		c.String(http.StatusInternalServerError, dbResp.Error.Error())
		return
	}

	c.JSON(http.StatusOK, plReq)
}

// DeletePickupLibrary removes a  library to the pickup library list
func (svc *ServiceContext) DeletePickupLibrary(c *gin.Context) {
	id := c.Param("id")
	log.Printf("INFO: delete pickup library %s", id)
	dbResp := svc.GDB.Delete(&pickupLibrary{}, id)
	if dbResp.Error != nil {
		log.Printf("ERROR: unable to delete pickup library: %s", dbResp.Error.Error())
		c.String(http.StatusInternalServerError, dbResp.Error.Error())
		return
	}

	log.Printf("INFO: remove default pickup library %s from all user preferences", id)
	var users []User
	dbResp = svc.GDB.Raw("select id,(preferences-'pickupLibrary') as preferences from users where preferences->'pickupLibrary'->>'id' = ?", id).Scan(&users)
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
	c.String(http.StatusOK, "deleted")
}
