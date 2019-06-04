package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	ginprometheus "github.com/zsais/go-gin-prometheus"
)

// TestVersion does a basic sanity check on the version endpoint
func TestVersion(t *testing.T) {
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	router.GET("/version", getVersion)

	// setup a new request to the endoint and attach a test recorder
	req, _ := http.NewRequest("GET", "/version", nil)
	rr := httptest.NewRecorder()

	// Service the request and record response
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Wrong status code: got %v want %v", status, http.StatusOK)
	}
	resp := rr.Body.String()
	if strings.Contains(resp, "version") == false {
		t.Errorf("Response %s doesn't include version", resp)
	}
}

// TestHealthcheck does a basic sanity check on the healthcheck endpoint
func TestHealthcheck(t *testing.T) {
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	router.GET("/healthcheck", healthCheck)

	// setup a new request to the endoint and attach a test recorder
	req, _ := http.NewRequest("GET", "/healthcheck", nil)
	rr := httptest.NewRecorder()

	// Service the request and record response
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Wrong status code: got %v want %v", status, http.StatusOK)
	}
	resp := rr.Body.String()
	if strings.Contains(resp, "false") == true {
		t.Errorf("Response %s indicates failed healthchecks", resp)
	}
}

// TestMetrics does a basic sanity check on the metrics endpoint
func TestMetrics(t *testing.T) {
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	p := ginprometheus.NewPrometheus("gin")
	p.Use(router)

	// setup a new request to the endoint and attach a test recorder
	req, _ := http.NewRequest("GET", "/metrics", nil)
	rr := httptest.NewRecorder()

	// Service the request and record response
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Wrong status code: got %v want %v", status, http.StatusOK)
	}
	resp := rr.Body.String()
	if strings.Contains(resp, "go_goroutines") == false {
		t.Errorf("Response %s missing go_goroutines", resp)
	}
}
