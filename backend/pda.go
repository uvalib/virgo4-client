package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (svc *ServiceContext) getPdaReport(c *gin.Context) {
	log.Printf("INFO: get pda orders")

	page := c.Query("page")
	pdaPath := fmt.Sprintf("/orders?page=%s", page)

	rawResp, errResp := svc.PDAGet(pdaPath, c.GetString("jwt"))
	if errResp != nil {
		log.Printf("WARN: PDA Error: %s", errResp.Message)
		c.String(errResp.StatusCode, errResp.Message)
		return
	}

	var pdaResp map[string]interface{}
	if err := json.Unmarshal([]byte(rawResp), &pdaResp); err != nil {
		log.Printf("ERROR: unable to parse PDA response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, pdaResp)
}
