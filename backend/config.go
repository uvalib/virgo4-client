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

// DBConfig wraps up all of the DB configuration
type DBConfig struct {
	Host string
	Port int
	User string
	Pass string
	Name string
}

// SolrConfig wraps up the config for solr acess
type SolrConfig struct {
	URL  string
	Core string
}

// IlliadConfig contains the configuration necessary to communicate with the Illiad API
type IlliadConfig struct {
	URL    string
	APIKey string
}

// ServiceConfig defines all of the v4client service configuration parameters
type ServiceConfig struct {
	Port               int
	VirgoURL           string
	CitationsURL       string
	SearchAPI          string
	CourseReserveEmail string
	LawReserveEmaiil   string
	FeedbackEmail      string
	ILSAPI             string
	JWTKey             string
	Dev                DevConfig
	DB                 DBConfig
	SMTP               SMTPConfig
	Illiad             IlliadConfig
	Solr               SolrConfig
}

// DevConfig specifies configuration params specific to development mode
type DevConfig struct {
	AuthUser string
	Role     string
	Kiosk    bool
	FakeSMTP bool
}

// LoadConfig will load the service configuration from env/cmdline
func LoadConfig() *ServiceConfig {
	var cfg ServiceConfig
	flag.IntVar(&cfg.Port, "port", 8080, "Service port (default 8080)")
	flag.StringVar(&cfg.VirgoURL, "virgo", "https://v4.virginia.edu", "URL to Virgo")
	flag.StringVar(&cfg.CitationsURL, "citations", "https://citations-ws-dev.internal.lib.virginia.edu", "Citations service URL")
	flag.StringVar(&cfg.SearchAPI, "search", "", "Search API URL")
	flag.StringVar(&cfg.JWTKey, "jwtkey", "", "JWT signature key")
	flag.StringVar(&cfg.CourseReserveEmail, "cremail", "", "Email recipient for course reserves requests")
	flag.StringVar(&cfg.LawReserveEmaiil, "lawemail", "", "Law Email recipient for course reserves requests")
	flag.StringVar(&cfg.FeedbackEmail, "feedbackemail", "", "Email recipient for feedback")
	flag.StringVar(&cfg.ILSAPI, "ils", "https://ils-connector.lib.virginia.edu", "ILS Connector API URL")

	// Solr config
	flag.StringVar(&cfg.Solr.URL, "solr", "", "Solr URL for journal browse")
	flag.StringVar(&cfg.Solr.Core, "core", "test_core", "Solr core for journal browse")

	// Dev mode settings
	flag.StringVar(&cfg.Dev.AuthUser, "devuser", "", "Authorized computing id for dev")
	flag.StringVar(&cfg.Dev.Role, "devrole", "", "User role for dev")
	flag.BoolVar(&cfg.Dev.Kiosk, "devkiosk", false, "Flag to torn Kiosk Mode on for dev")
	flag.BoolVar(&cfg.Dev.FakeSMTP, "stubsmtp", false, "Log email insted of sending (dev mode)")

	// Illiad communications
	flag.StringVar(&cfg.Illiad.URL, "illiad", "", "Illiad API URL")
	flag.StringVar(&cfg.Illiad.APIKey, "illiadkey", "", "Illiad API Key")

	// DB connection params
	flag.StringVar(&cfg.DB.Host, "dbhost", "localhost", "Database host")
	flag.IntVar(&cfg.DB.Port, "dbport", 5432, "Database port")
	flag.StringVar(&cfg.DB.Name, "dbname", "virgo4", "Database name")
	flag.StringVar(&cfg.DB.User, "dbuser", "v4user", "Database user")
	flag.StringVar(&cfg.DB.Pass, "dbpass", "pass", "Database password")

	// SMTP settings
	flag.StringVar(&cfg.SMTP.Host, "smtphost", "", "SMTP Host")
	flag.IntVar(&cfg.SMTP.Port, "smtpport", 0, "SMTP Port")
	flag.StringVar(&cfg.SMTP.User, "smtpuser", "", "SMTP User")
	flag.StringVar(&cfg.SMTP.Pass, "smtppass", "", "SMTP Password")
	flag.StringVar(&cfg.SMTP.Sender, "smtpsender", "virgo4@virginia.edu", "SMTP sender email")
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
	if cfg.CourseReserveEmail == "" {
		log.Fatal("cremail param is required")
	} else {
		log.Printf("Course Reserves email recipient: %s", cfg.CourseReserveEmail)
	}
	if cfg.LawReserveEmaiil == "" {
		log.Fatal("lawemail param is required")
	} else {
		log.Printf("Law Course Reserves email recipient: %s", cfg.LawReserveEmaiil)
	}
	if cfg.FeedbackEmail == "" {
		log.Fatal("feedbackemail param is required")
	} else {
		log.Printf("Feedback email recipient: %s", cfg.FeedbackEmail)
	}
	if cfg.Solr.URL == "" || cfg.Solr.Core == "" {
		log.Fatal("solr and core params are required")
	} else {
		log.Printf("Solr endpoint: %s/%s", cfg.Solr.URL, cfg.Solr.Core)
	}
	if cfg.CitationsURL == "" {
		log.Fatal("citations url param is required")
	} else {
		log.Printf("Citations URL: %s", cfg.CitationsURL)
	}
	if cfg.JWTKey == "" {
		log.Fatal("jwtkey param is required")
	}

	return &cfg
}
