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
const version = "2.12.0"

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

	// No version headers for RSS
	apiWithoutVersion := router.Group("/api")
	apiWithoutVersion.GET("/searches/:token/rss", svc.GetRSSFeed)

	// all other api routes ensure virgo versions are correct
	api := router.Group("/api")
	api.Use(svc.versionMiddleware)

	api.POST("/error", svc.LogClientError)

	api.GET("/bookmarks/:token", svc.GetPublicBookmarks)
	api.GET("/codes", svc.AuthMiddleware, svc.GetCodes)

	// signed in user changes their passeord
	api.POST("/change_password", svc.AuthMiddleware, svc.ChangePassword)

	// signed out user forgot password sequance
	api.POST("/forgot_password", svc.requestPasswordReset)
	api.POST("/reset_password", svc.resetPassword)

	api.GET("/searches/:token", svc.AuthMiddleware, svc.GetSearch)
	api.GET("/availability/:id", svc.AuthMiddleware, svc.getItemAvailability)

	api.POST("/coursereserves", svc.AuthMiddleware, svc.createCourseReserves)
	api.POST("/coursereserves/validate", svc.AuthMiddleware, svc.validateCourseReserves)
	api.GET("/coursereserves/search", svc.AuthMiddleware, svc.searchCourseReserves)

	users := api.Group("/users").Use(svc.AuthMiddleware, svc.UserMiddleware)
	users.GET("/:uid", svc.GetUser)
	users.GET("/:uid/illiad", svc.GetILLiadRequests)
	users.GET("/:uid/bills", svc.GetUserBills)
	users.GET("/:uid/checkouts.csv", svc.DownloadUserCheckouts)
	users.GET("/:uid/checkouts", svc.GetUserCheckouts)
	users.GET("/:uid/holds", svc.GetUserHolds)
	users.POST("/:uid/checkouts/renew", svc.RenewCheckouts)
	users.GET("/:uid/preferences", svc.GetPreferences)
	users.POST("/:uid/preferences", svc.SavePreferences)
	users.POST("/:uid/contact", svc.RequestContactUpdate)

	users.GET("/:uid/searches", svc.GetUserSavedSearches)
	users.GET("/:uid/searches/exists", svc.SavedSearchExists)
	users.POST("/:uid/searches", svc.SaveSearch)
	users.DELETE("/:uid/searches/:id", svc.DeleteSavedSearch)
	users.DELETE("/:uid/searches", svc.DeleteAllSavedSearches)
	users.POST("/:uid/searches/:id/publish", svc.PublishSavedSearch)
	users.DELETE("/:uid/searches/:id/publish", svc.UnpublishSavedSearch)

	users.POST("/:uid/bookmarks/manage", svc.ManageBookmarkStorage)
	users.POST("/:uid/bookmarks/folders/add", svc.AddBookmarkFolder)
	users.DELETE("/:uid/bookmarks/folders/:id", svc.DeleteBookmarkFolder)
	users.POST("/:uid/bookmarks/folders/:id/delete", svc.DeleteBookmarks)
	users.POST("/:uid/bookmarks/folders/:id/sort", svc.ReorderBookmarks)
	users.POST("/:uid/bookmarks/folders/:id", svc.UpdateBookmarkFolder)
	users.POST("/:uid/bookmarks/folders/:id/refresh", svc.RefreshBookmarks)
	users.DELETE("/:uid/bookmarks/folders/:id/publish", svc.UnpublishBookmarkFolder)
	users.POST("/:uid/bookmarks/folders/:id/publish", svc.PublishBookmarkFolder)
	users.POST("/:uid/bookmarks/add", svc.AddBookmark)

	api.POST("/requests/hold", svc.AuthMiddleware, svc.CreateHold)
	api.DELETE("/requests/hold", svc.AuthMiddleware, svc.DeleteHold)
	api.POST("/requests/scan", svc.AuthMiddleware, svc.CreateScan)
	api.POST("/requests/standalone/scan", svc.AuthMiddleware, svc.CreateStandaloneScan)
	api.POST("/requests/standalone/borrow", svc.AuthMiddleware, svc.CreateBorrowRequest)
	api.POST("/requests/standalone/remediate", svc.AuthMiddleware, svc.pdfRemediationRequest)
	api.GET("/requests/standalone/outstanding", svc.AuthMiddleware, svc.getOutstandingStandaloneRequests)
	api.POST("/requests/openurl", svc.AuthMiddleware, svc.CreateOpenURLRequest)
	api.POST("/requests/account", svc.AuthMiddleware, svc.CreateAccountRequest)

	api.POST("/illiad/register", svc.AuthMiddleware, svc.illiadRegistrationRequest)

	api.POST("/pickuplibraries", svc.AuthMiddleware, svc.AddPickupLibrary)
	api.POST("/pickuplibraries/:id/update", svc.AuthMiddleware, svc.UpdatePickupLibrary)
	api.DELETE("/pickuplibraries/:id", svc.AuthMiddleware, svc.DeletePickupLibrary)

	api.GET("/pda", svc.AuthMiddleware, svc.getPdaReport)

	api.POST("/feedback", svc.AuthMiddleware, svc.SendFeedback)

	api.POST("/reauth", svc.RefreshAuthentication)

	api.POST("/createTempAccount", svc.AuthMiddleware, svc.CreateTempAccount)
	api.GET("/activateTempAccount/:token", svc.ActivateTempAccount)

	admin := api.Group("/admin")
	{
		admin.POST("/claims", svc.AuthMiddleware, svc.SetAdminClaims)
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
