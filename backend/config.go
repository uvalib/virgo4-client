package main

import (
	"flag"
	"log"
)

// ServiceConfig defines all of the v4client service configuration parameters
type ServiceConfig struct {
	Port        int
	SearchAPI   string
	ILSAPI      string
	DevAuthUser string
}

// LoadConfig will load the service configuration from env/cmdline
func LoadConfig() *ServiceConfig {
	var cfg ServiceConfig
	flag.IntVar(&cfg.Port, "port", 8080, "Service port (default 8080)")
	flag.StringVar(&cfg.SearchAPI, "search", "", "Search API URL")
	flag.StringVar(&cfg.ILSAPI, "ils", "https://ils-connector.lib.virginia.edu/v2", "ILS Connector API URL")
	flag.StringVar(&cfg.DevAuthUser, "devuser", "", "Authorized computing id for dev")
	flag.Parse()

	if cfg.SearchAPI == "" {
		log.Fatal("search param is required")
	} else {
		log.Printf("Search API endpoint: %s", cfg.SearchAPI)
	}
	if cfg.ILSAPI == "" {
		log.Fatal("ils param is required")
	} else {
		log.Printf("ILS Connector API endpoint: %s", cfg.ILSAPI)
	}

	return &cfg
}
