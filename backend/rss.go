package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	dbx "github.com/go-ozzo/ozzo-dbx"
	"github.com/gorilla/feeds"
	"github.com/uvalib/virgo4-api/v4api"
	"github.com/uvalib/virgo4-jwt/v4jwt"
)

// GetRSSFeed returns the RSS feed for the specified public saved search
func (svc *ServiceContext) GetRSSFeed(c *gin.Context) {

	token := c.Param("token")
	log.Printf("Get saved search %s", token)
	var search SavedSearch
	err := svc.DB.Select().Where(dbx.HashExp{"token": token}).One(&search)
	if err != nil {
		log.Printf("Search %s not found", token)
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}

	if !search.Public {
		c.JSON(http.StatusUnprocessableEntity, nil)
		return
	}

	queryStr := search.URL
	// Remove everything but the query string
	re := regexp.MustCompile(`^.*\?`)
	queryStr = re.ReplaceAllLiteralString(queryStr, "")
	query, err := url.ParseQuery(queryStr)
	if err != nil {
		log.Printf("Invalid saved search: %s", err)
	}

	type facetStruct struct {
		FacetID string `json:"facet_id"`
		Value   string `json:"value"`
	}
	filter := v4api.Filter{
		PoolID: query.Get("pool"),
	}

	for _, f := range query["filter"] {

		var fObj map[string][]string
		json.Unmarshal([]byte(f), &fObj)
		log.Printf("facet: %+v", fObj)

		for facetKey, facetValues := range fObj {

			for _, fValue := range facetValues {
				facet := facetStruct{
					FacetID: facetKey,
					Value:   fValue,
				}
				filter.Facets = append(filter.Facets, facet)

			}

		}

	}
	if err != nil {
		log.Printf("Invalid facets: %s \n%s", err, query)
	}

	//log.Printf("Filter: %+v", filter)

	// Format search query
	rssSort := v4api.SortOrder{
		SortID: "SortDateReceived",
		Order:  "desc",
	}
	rssPagination := v4api.Pagination{
		Start: 0,
		Rows:  20,
	}

	searchData := v4api.SearchRequest{
		Query:      query.Get("q"),
		Filters:    []v4api.Filter{filter},
		Sort:       rssSort,
		Pagination: rssPagination,
	}
	log.Printf("REQUEST: %+v", searchData)

	guestClaim := v4jwt.V4Claims{Role: v4jwt.Guest}
	signedStr, err := v4jwt.Mint(guestClaim, time.Minute, svc.JWTKey)

	searchResp, _ := svc.SearchPost(searchData, signedStr)

	var searchResult v4api.PoolResult
	if err := json.Unmarshal(searchResp, &searchResult); err != nil {
		log.Printf("RSS query error: %s", err)
	}

	log.Printf("search: %+v", searchResult)

	now := time.Now()
	savedUrl := svc.VirgoURL + "/search/" + search.Token
	feed := &feeds.Feed{
		Title:       "Virgo Feed (" + search.Name + ")",
		Link:        &feeds.Link{Href: savedUrl},
		Description: "A Virgo RSS feed based on a saved search",
		//Author:      &feeds.Author{Name: "Jason Moiron", Email: "jmoiron@jmoiron.net"},
		Created: now,
	}

	// Set feed items
	feed.Items = svc.MapFeedItems(searchResult)

	// Output the feed
	rss, _ := feed.ToRss()
	if err != nil {
		log.Fatal(err)
	}
	c.Writer.Header().Set("Content-Type", "application/xml")
	c.Writer.Write([]byte(rss))

}
func (svc *ServiceContext) MapFeedItems(poolResults v4api.PoolResult) []*feeds.Item {

	//log.Printf("%+v", poolResults)
	items := []*feeds.Item{}
	tz, _ := time.LoadLocation("America/New_York")

	for _, group := range poolResults.Groups {
		for _, record := range group.Records {
			var feedItem feeds.Item

			for _, field := range record.Fields {
				switch field.Name {
				case "id":
					virgoUrl := svc.VirgoURL + "/items/" + field.Value
					feedItem.Id = field.Value
					feedItem.Link = &feeds.Link{Rel: "self", Href: virgoUrl}
					feedItem.Description += "<p>Virgo URL: " + virgoUrl + "</p>"
				case "access-url":
					feedItem.Source = &feeds.Link{Href: field.Value}
				case "title_subtitle_edition":
					feedItem.Title = field.Value
				case "author":
					a := feeds.Author{}
					if feedItem.Author != nil {
						a.Name = (feedItem.Author.Name + "; " + field.Value)
					} else {
						a.Name = field.Value
					}
					feedItem.Author = &a

				case "date_received":
					var parseErr error
					feedItem.Created, parseErr = time.ParseInLocation("20060102", field.Value, tz)
					if parseErr != nil {
						log.Printf("RSS Date parse error: %+v", parseErr)
					}
				}
				log.Printf("Field: %+v", field)
				if field.Display != "optional" && field.Name != "id" {
					feedItem.Description += fmt.Sprintf("<p>%s: %s</p>", field.Label, field.Value)

				}

			}
			//log.Printf("RSS ITEM: %+v", feedItem)
			items = append(items, &feedItem)
		}
	}
	return items

}
