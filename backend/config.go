package main

import (
	"flag"
	"log"
)

// SMTPConfig wraps up all of the smpt configuration
type SMTPConfig struct {
	Host   string
	Port   int
	User   string
	Pass   string
	Sender string
}

// FirebaseConfig wraps up all of the firebase connection configuration
type FirebaseConfig struct {
	APIKey      string `json:"apiKey"`
	AuthDomain  string `json:"authDomain"`
	DatabaseURL string `json:"databaseURL"`
	ProjectID   string `json:"projectId"`
	AppID       string `json:"appId"`
}

// DBConfig wraps up all of the DB configuration
type DBConfig struct {
	Host string
	Port int
	User string
	Pass string
	Name string
}

// IlliadConfig contains the configuration necessary to communicate with the Illiad API
type IlliadConfig struct {
	URL          string
	APIKey       string
	HealthSciURL string
}

// DevConfig specifies configuration params specific to development mode
type DevConfig struct {
	AuthUser string
	Role     string
	Kiosk    bool
	FakeSMTP bool
}

// ServiceConfig defines all of the v4client service configuration parameters
type ServiceConfig struct {
	Port           int
	VirgoURL       string
	CitationsURL   string
	CollectionsURL string
	ShelfBrowseURL string
	SearchAPI      string
	FeedbackEmail  string
	ILSAPI         string
	PDAAPI         string
	CatalogPoolURL string
	JWTKey         string
	Dev            DevConfig
	DB             DBConfig
	SMTP           SMTPConfig
	Illiad         IlliadConfig
	Firebase       FirebaseConfig
	DibsURL        string
}

// LoadConfig will load the service configuration from env/cmdline
func LoadConfig() *ServiceConfig {
	var cfg ServiceConfig
	flag.IntVar(&cfg.Port, "port", 8080, "Service port (default 8080)")
	flag.StringVar(&cfg.VirgoURL, "virgo", "https://search.virginia.edu", "URL to Virgo")
	flag.StringVar(&cfg.CitationsURL, "citations", "https://collections-ws-dev.internal.lib.virginia.edu", "Citations service URL")
	flag.StringVar(&cfg.CollectionsURL, "collections", "https://collections-ws-dev.internal.lib.virginia.edu", "Collections service URL")
	flag.StringVar(&cfg.ShelfBrowseURL, "shelf", "https://shelf-browse-ws-dev.internal.lib.virginia.edu", "Shelf Browse service URL")
	flag.StringVar(&cfg.SearchAPI, "search", "", "Search API URL")
	flag.StringVar(&cfg.JWTKey, "jwtkey", "", "JWT signature key")
	flag.StringVar(&cfg.FeedbackEmail, "feedbackemail", "", "Email recipient for feedback")
	flag.StringVar(&cfg.ILSAPI, "ils", "https://ils-connector.lib.virginia.edu", "ILS Connector API URL")
	flag.StringVar(&cfg.CatalogPoolURL, "catalogPoolURL", "https://pool-solr-ws-uva-library-dev.internal.lib.virginia.edu/api/search", "Catalog Pool API URL")

	// Dev mode settings
	flag.StringVar(&cfg.Dev.AuthUser, "devuser", "", "Authorized computing id for dev")
	flag.StringVar(&cfg.Dev.Role, "devrole", "", "User role for dev")
	flag.BoolVar(&cfg.Dev.Kiosk, "devkiosk", false, "Flag to torn Kiosk Mode on for dev")
	flag.BoolVar(&cfg.Dev.FakeSMTP, "stubsmtp", false, "Log email insted of sending (dev mode)")

	// Illiad communications
	flag.StringVar(&cfg.Illiad.URL, "illiad", "", "Illiad API URL")
	flag.StringVar(&cfg.Illiad.APIKey, "illiadkey", "", "Illiad API Key")
	flag.StringVar(&cfg.Illiad.HealthSciURL, "hsilliad", "", "HS Illiad API URL")

	// DB connection params
	flag.StringVar(&cfg.DB.Host, "dbhost", "localhost", "Database host")
	flag.IntVar(&cfg.DB.Port, "dbport", 5432, "Database port")
	flag.StringVar(&cfg.DB.Name, "dbname", "virgo4", "Database name")
	flag.StringVar(&cfg.DB.User, "dbuser", "v4user", "Database user")
	flag.StringVar(&cfg.DB.Pass, "dbpass", "pass", "Database password")

	// PDA API connection params
	flag.StringVar(&cfg.PDAAPI, "pda", "https://pda-ws-dev.internal.lib.virginia.edu", "Patron Driven Acquisition API URL")

	// SMTP settings
	flag.StringVar(&cfg.SMTP.Host, "smtphost", "", "SMTP Host")
	flag.IntVar(&cfg.SMTP.Port, "smtpport", 25, "SMTP Port")
	flag.StringVar(&cfg.SMTP.User, "smtpuser", "", "SMTP User")
	flag.StringVar(&cfg.SMTP.Pass, "smtppass", "", "SMTP Password")
	flag.StringVar(&cfg.SMTP.Sender, "smtpsender", "virgo4@virginia.edu", "SMTP sender email")

	// Firebase connection (just gets passed to client)
	flag.StringVar(&cfg.Firebase.APIKey, "fbkey", "", "Firebase API key")
	flag.StringVar(&cfg.Firebase.AppID, "fbapp", "", "Firebase app ID")
	flag.StringVar(&cfg.Firebase.AuthDomain, "fbdomain", "", "Firebase auth domain")
	flag.StringVar(&cfg.Firebase.DatabaseURL, "fbdb", "", "Firebase database URL")
	flag.StringVar(&cfg.Firebase.ProjectID, "fbproject", "", "Firebase projectID")

	// DIBS electronic reserves base URL
	flag.StringVar(&cfg.DibsURL, "dibsurl", "", "DIBS electronic reserves base URL")

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
	if cfg.PDAAPI == "" {
		log.Fatal("pda param is required")
	} else {
		log.Printf("PDA API endpoint: %s", cfg.PDAAPI)
	}
	if cfg.CatalogPoolURL == "" {
		log.Fatal("catalog pool param is required")
	} else {
		log.Printf("Catalog Pool API endpoint: %s", cfg.CatalogPoolURL)
	}
	if cfg.FeedbackEmail == "" {
		log.Fatal("feedbackemail param is required")
	} else {
		log.Printf("Feedback email recipient: %s", cfg.FeedbackEmail)
	}
	if cfg.CitationsURL == "" {
		log.Fatal("citations url param is required")
	} else {
		log.Printf("Citations URL: %s", cfg.CitationsURL)
	}
	if cfg.CollectionsURL == "" {
		log.Fatal("collections url param is required")
	} else {
		log.Printf("Collections URL: %s", cfg.CollectionsURL)
	}
	if cfg.ShelfBrowseURL == "" {
		log.Fatal("shelf browse url param is required")
	} else {
		log.Printf("Shelf Browse URL: %s", cfg.ShelfBrowseURL)
	}
	if cfg.JWTKey == "" {
		log.Fatal("jwtkey param is required")
	}
	if cfg.DibsURL == "" {
		log.Fatal("dibsurl param is required")
	} else {
		log.Printf("DIBS URL: %s", cfg.DibsURL)
	}

	if cfg.Firebase.APIKey == "" {
		cfg.Firebase.AppID = ""
		cfg.Firebase.AuthDomain = ""
		cfg.Firebase.DatabaseURL = ""
		cfg.Firebase.ProjectID = ""
		log.Printf("Firebase connectivity is not configured")
	} else {
		log.Printf("Firebase configured for project ID: %s", cfg.Firebase.ProjectID)
	}

	return &cfg
}
