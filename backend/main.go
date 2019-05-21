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

// getVersion reports the version of the serivce
func getVersion(c *gin.Context) {
	c.String(http.StatusOK, "Virgo4 Client server version %s", version)
}

// healthCheck reports the health of the server
func healthCheck(c *gin.Context) {
	c.String(http.StatusOK, "Virgo4 Client server is alive")
}

/**
 * MAIN
 */
func main() {
	log.Printf("===> Virgo4 client server staring up <===")
	var port int
	flag.IntVar(&port, "port", 8080, "Service port (default 8080)")
	flag.Parse()

	log.Printf("Setup routes...")
	gin.SetMode(gin.ReleaseMode)
	gin.DisableConsoleColor()
	router := gin.Default()
	router.GET("/version", getVersion)
	router.GET("/healthcheck", healthCheck)

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
