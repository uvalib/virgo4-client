package main

import (
	"fmt"
	"log"
	"strings"

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
	backendRoutes := []string{"/version", "/healthcheck", "/config", "/authorize", "/signout", "/api", "/authenticate"}
	p.ReqCntURLLabelMappingFn = func(c *gin.Context) string {
		url := c.Request.URL.Path
		backEndRoute := false
		for _, tgt := range backendRoutes {
			if strings.Index(url, tgt) == 0 {
				backEndRoute = true
				break
			}
		}
		if backEndRoute == false {
			return ":vue"
		}
		for _, p := range c.Params {
			if p.Key == "token" {
				url = strings.Replace(url, p.Value, ":token", 1)
			}
			if p.Key == "id" {
				url = strings.Replace(url, p.Value, ":id", 1)
			}
			if p.Key == "uid" {
				url = strings.Replace(url, p.Value, ":uid", 1)
			}
			if p.Key == "holdid" {
				url = strings.Replace(url, p.Value, ":holdid", 1)
			}
		}
		return url
	}
	p.Use(router)

	router.GET("/version", svc.GetVersion)
	router.GET("/healthcheck", svc.HealthCheck)
	router.GET("/config", svc.GetConfig)
	router.POST("/authorize", svc.Authorize)
	router.POST("/signout", svc.SignOut)

	api := router.Group("/api")
	{
		api.GET("/bookmarks/:token", svc.GetPublicBookmarks)
		api.GET("/codes", svc.AuthMiddleware, svc.GetCodes)
		api.POST("/change_pin", svc.AuthMiddleware, svc.ChangePin)
		api.GET("/search_filters", svc.AuthMiddleware, svc.GetSearchFilters)
		api.GET("/searches/:token", svc.AuthMiddleware, svc.GetSearch)
		api.GET("/users/:uid", svc.AuthMiddleware, svc.GetUser)
		api.GET("/users/:uid/illiad", svc.AuthMiddleware, svc.GetILLiadRequests)
		api.GET("/users/:uid/bills", svc.AuthMiddleware, svc.GetUserBills)
		api.GET("/users/:uid/checkouts", svc.AuthMiddleware, svc.GetUserCheckouts)
		api.GET("/users/:uid/holds", svc.AuthMiddleware, svc.GetUserHolds)
		api.POST("/users/:uid/checkouts/renew", svc.AuthMiddleware, svc.RenewCheckouts)
		api.POST("/users/:uid/preferences", svc.AuthMiddleware, svc.SavePreferences)

		api.GET("/users/:uid/searches", svc.AuthMiddleware, svc.UserMiddleware, svc.GetUserSavedSearches)
		api.POST("/users/:uid/searches", svc.AuthMiddleware, svc.UserMiddleware, svc.SaveSearch)
		api.DELETE("/users/:uid/searches/:token", svc.AuthMiddleware, svc.UserMiddleware, svc.DeleteSavedSearch)
		api.PUT("/users/:uid/searches/:token", svc.AuthMiddleware, svc.UserMiddleware, svc.UpdateSavedSearch)
		api.DELETE("/users/:uid/searches", svc.AuthMiddleware, svc.UserMiddleware, svc.DeleteAllSavedSearches)
		api.POST("/users/:uid/searches/:token/publish", svc.AuthMiddleware, svc.UserMiddleware, svc.PublishSavedSearch)
		api.DELETE("/users/:uid/searches/:token/publish", svc.AuthMiddleware, svc.UserMiddleware, svc.UnpublishSavedSearch)

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
		api.POST("/requests/scan", svc.AuthMiddleware, svc.CreateScan)
		api.POST("/requests/standalone/scan", svc.AuthMiddleware, svc.CreateStandaloneScan)
		api.POST("/requests/standalone/borrow", svc.AuthMiddleware, svc.CreateBorrowRequest)
		api.POST("/requests/openurl", svc.AuthMiddleware, svc.CreateOpenURLRequest)

		api.POST("/reserves", svc.AuthMiddleware, svc.CreateCourseReserves)
		api.POST("/reserves/validate", svc.AuthMiddleware, svc.ValidateCourseReserves)
		api.GET("/reserves/search", svc.AuthMiddleware, svc.SearchReserves)
		api.POST("/feedback", svc.AuthMiddleware, svc.SendFeedback)

		api.POST("/reauth", svc.RefreshAuthentication)

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
	// pprof.Register(router)
	log.Fatal(router.Run(portStr))
}
