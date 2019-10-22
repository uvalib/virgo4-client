package main

import (
	"flag"
	"log"
)

// SMTPConfig wraps up all of the smpt configuration
type SMTPConfig struct {
	Host    string
	Port    int
	User    string
	Pass    string
	Sender  string
	DevMode bool
}

// DBConfig wraps up all of the DB configuration
type DBConfig struct {
	Host string
	Port int
	User string
	Pass string
	Name string
}

// ServiceConfig defines all of the v4client service configuration parameters
type ServiceConfig struct {
	Port               int
	SearchAPI          string
	CourseReserveEmail string
	ILSAPI             string
	DevAuthUser        string
	DB                 DBConfig
	SMTP               SMTPConfig
}

// LoadConfig will load the service configuration from env/cmdline
func LoadConfig() *ServiceConfig {
	var cfg ServiceConfig
	flag.IntVar(&cfg.Port, "port", 8080, "Service port (default 8080)")
	flag.StringVar(&cfg.SearchAPI, "search", "", "Search API URL")
	flag.StringVar(&cfg.CourseReserveEmail, "cremail", "", "Email recipient for course reserves requests")
	flag.StringVar(&cfg.ILSAPI, "ils", "https://ils-connector.lib.virginia.edu", "ILS Connector API URL")
	flag.StringVar(&cfg.DevAuthUser, "devuser", "", "Authorized computing id for dev")

	flag.StringVar(&cfg.DB.Host, "dbhost", "localhost", "Database host")
	flag.IntVar(&cfg.DB.Port, "dbport", 5432, "Database port")
	flag.StringVar(&cfg.DB.Name, "dbname", "virgo4", "Database name")
	flag.StringVar(&cfg.DB.User, "dbuser", "v4user", "Database user")
	flag.StringVar(&cfg.DB.Pass, "dbpass", "pass", "Database password")

	flag.StringVar(&cfg.SMTP.Host, "smtphost", "", "SMTP Host")
	flag.IntVar(&cfg.SMTP.Port, "smtpport", 0, "SMTP Port")
	flag.StringVar(&cfg.SMTP.User, "smtpuser", "", "SMTP User")
	flag.StringVar(&cfg.SMTP.Pass, "smtppass", "", "SMTP Password")
	flag.StringVar(&cfg.SMTP.Sender, "smtpsender", "virgo4@virginia.edu", "SMTP sender email")
	flag.BoolVar(&cfg.SMTP.DevMode, "stubsmtp", false, "Log email insted of sending (dev mode)")
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

	return &cfg
}
