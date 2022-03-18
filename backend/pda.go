package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func (svc *ServiceContext) getPdaReport(c *gin.Context) {
	log.Printf("INFO: get pda report for the last 7 days")
	type order struct {
		ISBN              string    `gorm:"column:isbn" json:"isbn"`
		CatalogKey        string    `json:"catalogKey"`
		Barcode           string    `json:"barcode"`
		Title             string    `json:"title"`
		ComputingID       string    `json:"computingID"`
		HoldLibrary       string    `json:"holdLibrary"`
		FundCode          string    `json:"fund_code"`
		LoanType          string    `json:"loanType"`
		VendorOrderNumber string    `json:"orderNumber"`
		CreatedAt         time.Time `json:"dateOrdered"`
	}
	var orders []order
	err := svc.PDADB.Where("created_at >= NOW() - INTERVAL '7 DAYS'").Find(&orders).Error
	if err != nil {
		log.Printf("ERROR: unable to get PDA report: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, orders)
}
