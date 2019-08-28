package main

import (
	"fmt"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
	ginprometheus "github.com/zsais/go-gin-prometheus"
)

// Version of the service
const version = "0.5.0"

/**
 * MAIN
 */
func main() {
	log.Printf("===> Virgo4 client service staring up <===")

	log.Printf("Loading service configuration")
	cfg := LoadConfig()

	log.Printf("Initialize service")
	svc, err := InitService(version, cfg)
	if err != nil {
		log.Fatal(err.Error())
	}

	log.Printf("Setup routes...")
	gin.SetMode(gin.ReleaseMode)
	gin.DisableConsoleColor()
	router := gin.Default()
	router.Use(cors.Default())
	p := ginprometheus.NewPrometheus("gin")
	p.Use(router)

	router.GET("/version", svc.GetVersion)
	router.GET("/healthcheck", svc.HealthCheck)
	router.GET("/config", svc.GetConfig)
	router.POST("/authorize", svc.Authorize)
	api := router.Group("/api")
	{
		api.GET("/users/:id", svc.AuthMiddleware, svc.GetUser)
		api.POST("/users/:id/signout", svc.AuthMiddleware, svc.SignoutUser)
		bookmarks := api.Group("/users/:id/bookmarks")
		{
			bookmarks.POST("/folders", svc.AuthMiddleware, svc.AddBookmarkFolder)
			bookmarks.DELETE("/folders", svc.AuthMiddleware, svc.DeleteBookmarkFolder)
			bookmarks.POST("/items", svc.AuthMiddleware, svc.AddBookmark)
			bookmarks.DELETE("/items", svc.AuthMiddleware, svc.DeleteBookmark)
		}
	}
	auth := router.Group("/authenticate")
	{
		auth.GET("/netbadge", svc.NetbadgeAuthentication)
		auth.POST("/public", svc.PublicAuthentication)
	}

	// Note: in dev mode, this is never actually used. The front end is served
	// by yarn and it proxies all requests to the API to the routes above
	router.Use(static.Serve("/", static.LocalFile("./public", true)))

	// add a catchall route that renders the index page.
	// based on no-history config setup info here:
	//    https://router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations
	router.NoRoute(func(c *gin.Context) {
		c.File("./public/index.html")
	})

	portStr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("Start service v%s on port %s", version, portStr)
	log.Fatal(router.Run(portStr))
}
