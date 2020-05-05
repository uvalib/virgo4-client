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
const version = "0.9.0"

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
		api.GET("/bookmarks/:token", svc.GetPublicBookmarks)
		api.GET("/availability/:id", svc.AuthMiddleware, svc.GetAvailability)
		api.GET("/codes", svc.AuthMiddleware, svc.GetCodes)
		api.POST("/change_pin", svc.AuthMiddleware, svc.ChangePin)
		api.POST("/journals", svc.GetJournalDetails)
		api.GET("/journals/browse", svc.BrowseJournals)
		api.GET("/searches/:token", svc.AuthMiddleware, svc.GetSearch)
		api.GET("/users/:uid", svc.GetUser)
		api.GET("/users/:uid/illiad", svc.GetILLiadRequests)
		api.GET("/users/:uid/bills", svc.AuthMiddleware, svc.GetUserBills)
		api.GET("/users/:uid/checkouts", svc.AuthMiddleware, svc.GetUserCheckouts)
		api.GET("/users/:uid/holds", svc.AuthMiddleware, svc.GetUserHolds)
		api.POST("/users/:uid/checkouts/renew", svc.AuthMiddleware, svc.RenewCheckouts)
		api.POST("/users/:uid/preferences", svc.AuthMiddleware, svc.SavePreferences)
		api.POST("/users/:uid/signout", svc.AuthMiddleware, svc.SignoutUser)

		api.GET("/users/:uid/searches", svc.AuthMiddleware, svc.GetUserSavedSearches)
		api.POST("/users/:uid/searches", svc.AuthMiddleware, svc.SaveSearch)
		api.DELETE("/users/:uid/searches", svc.AuthMiddleware, svc.DeleteAllSavedSearches)
		api.DELETE("/users/:uid/searches/:token", svc.AuthMiddleware, svc.DeleteSavedSearch)
		api.POST("/users/:uid/searches/:token/publish", svc.AuthMiddleware, svc.PublishSavedSearch)
		api.DELETE("/users/:uid/searches/:token/publish", svc.AuthMiddleware, svc.UnpublishSavedSearch)

		api.GET("/users/:uid/bookmarks", svc.AuthMiddleware, svc.GetBookmarks)
		api.POST("/users/:uid/bookmarks/move", svc.AuthMiddleware, svc.MoveBookmarks)
		api.POST("/users/:uid/bookmarks/delete", svc.AuthMiddleware, svc.DeleteBookmarks)
		api.POST("/users/:uid/bookmarks/folders", svc.AuthMiddleware, svc.AddBookmarkFolder)
		api.DELETE("/users/:uid/bookmarks/folders/:id", svc.AuthMiddleware, svc.DeleteBookmarkFolder)
		api.POST("/users/:uid/bookmarks/folders/:id", svc.AuthMiddleware, svc.UpdateBookmarkFolder)
		api.DELETE("/users/:uid/bookmarks/folders/:id/publish", svc.AuthMiddleware, svc.UnpublishBookmarkFolder)
		api.POST("/users/:uid/bookmarks/folders/:id/publish", svc.AuthMiddleware, svc.PublishBookmarkFolder)
		api.POST("/users/:uid/bookmarks/items", svc.AuthMiddleware, svc.AddBookmark)

		api.POST("/requests/hold", svc.AuthMiddleware, svc.CreateHold)
		api.DELETE("/requests/hold/:holdID", svc.AuthMiddleware, svc.DeleteHold)

		api.POST("/reserves", svc.AuthMiddleware, svc.CreateCourseReserves)
		api.POST("/reserves/validate", svc.AuthMiddleware, svc.ValidateCourseReserves)
		api.GET("/reserves/search", svc.AuthMiddleware, svc.SearchReserves)
		api.POST("/feedback", svc.AuthMiddleware, svc.SendFeedback)

		admin := api.Group("/admin")
		{
			admin.POST("/claims", svc.AuthMiddleware, svc.SetAdminClaims)
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
