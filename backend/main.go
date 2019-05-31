package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
)

// Version of the service
const version = "1.0.0"

// URL for the search API
var searchAPI string
var showDebug bool
var showWarn bool

// getVersion reports the version of the serivce
func getVersion(c *gin.Context) {
	c.String(http.StatusOK, "Virgo4 Client server version %s", version)
}

// healthCheck reports the health of the server
func healthCheck(c *gin.Context) {
	c.String(http.StatusOK, "Virgo4 Client server is alive")
}

// getConfig returns front-end configuration data as JSON
func getConfig(c *gin.Context) {
	type config struct {
		SearchAPI string `json:"searchAPI"`
		ShowDebug bool   `json:"showDebug"`
		ShowWarn  bool   `json:"showWarn"`
	}
	cfg := config{SearchAPI: searchAPI, ShowDebug: showDebug, ShowWarn: showWarn}
	c.JSON(http.StatusOK, cfg)
}

/**
 * MAIN
 */
func main() {
	log.Printf("===> Virgo4 client server staring up <===")
	var port int

	flag.IntVar(&port, "port", 8080, "Service port (default 8080)")
	flag.BoolVar(&showDebug, "debug", false, "Show debug info")
	flag.BoolVar(&showWarn, "warn", false, "Show warning info")
	flag.StringVar(&searchAPI, "search", "", "Search API URL")
	flag.Parse()
	if searchAPI == "" {
		log.Fatal("search param is required")
	} else {
		log.Printf("Search API endpoint: %s", searchAPI)
	}
	log.Printf("Show debug: %t, Show warn: %t", showDebug, showWarn)

	log.Printf("Setup routes...")
	gin.SetMode(gin.ReleaseMode)
	gin.DisableConsoleColor()
	router := gin.Default()
	router.GET("/version", getVersion)
	router.GET("/healthcheck", healthCheck)
	router.GET("/config", getConfig)

	// Note: in dev mode, this is never actually used. The front end is served
	// by yarn and it proxies all requests to the API to the routes above
	router.Use(static.Serve("/", static.LocalFile("./public", true)))

	// add a catchall route that renders the index page.
	// based on no-history config setup info here:
	//    https://router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations
	router.NoRoute(func(c *gin.Context) {
		c.File("./public/index.html")
	})

	portStr := fmt.Sprintf(":%d", port)
	log.Printf("Start service v%s on port %s", version, portStr)
	log.Fatal(router.Run(portStr))
}
