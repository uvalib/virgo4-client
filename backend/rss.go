package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/feeds"
	"github.com/uvalib/virgo4-api/v4api"
	"github.com/uvalib/virgo4-jwt/v4jwt"
)

// GetRSSFeed returns the RSS feed for the specified public saved search
func (svc *ServiceContext) GetRSSFeed(c *gin.Context) {

	token := c.Param("token")
	log.Printf("Get saved search %s", token)
	var search SavedSearch
	resp := svc.GDB.Where("token=?", token).First(&search)
	if resp.Error != nil {
		log.Printf("ERROR: search %s not found", token)
		c.String(http.StatusNotFound, "%s not found", token)
		return
	}

	if !search.IsPublic {
		c.JSON(http.StatusUnprocessableEntity, nil)
		return
	}

	queryStr := search.SearchURL
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
	savedURL := svc.VirgoURL + "/search/" + search.Token
	feed := &feeds.Feed{
		Title:       "Virgo Feed (" + search.Name + ")",
		Link:        &feeds.Link{Href: savedURL},
		Description: "A Virgo RSS feed based on a saved search",
		Created:     now,
	}

	// Set feed items
	feed.Items = svc.mapFeedItems(searchResult)

	// Output the feed
	rss, _ := feed.ToRss()
	if err != nil {
		log.Fatal(err)
	}
	c.Writer.Header().Set("Content-Type", "application/xml")
	c.Writer.Write([]byte(rss))

}
func (svc *ServiceContext) mapFeedItems(poolResults v4api.PoolResult) []*feeds.Item {

	//log.Printf("%+v", poolResults)
	items := []*feeds.Item{}
	tz, _ := time.LoadLocation("America/New_York")

	for _, group := range poolResults.Groups {
		for _, record := range group.Records {
			var feedItem feeds.Item

			// Syndetics Unbound will detect all ISBNs in the feed and display images for them.
			// This can result in multiple images for items, when at most one is desired.
			// We attempt to prevent this by only including one ISBN in the description field, but
			// only if the access URL in the source field does not contain any of the known ISBNs.

			var isbns []string
			var isbnLabel string

			// first, process all fields except ISBN (just collect them for now)
			for _, field := range record.Fields {

				includeField := field.Display != "optional"

				switch {
				case field.Name == "id" || field.Type == "identifier":
					virgoURL := svc.VirgoURL + "/items/" + field.Value
					feedItem.Id = field.Value
					feedItem.Link = &feeds.Link{Rel: "self", Href: virgoURL}
					feedItem.Description += "<p>Virgo URL: " + virgoURL + "</p>"
					includeField = false

				case field.Name == "access_url" || field.Type == "access-url":
					feedItem.Source = &feeds.Link{Href: field.Value}
					includeField = false

				case field.Name == "title_subtitle_edition" || field.Type == "title":
					feedItem.Title = field.Value

				case field.Name == "author" || field.Type == "author":
					a := feeds.Author{}
					if feedItem.Author != nil {
						a.Name = (feedItem.Author.Name + "; " + field.Value)
					} else {
						a.Name = field.Value
					}
					feedItem.Author = &a

				case field.Name == "date_received":
					var parseErr error
					feedItem.Created, parseErr = time.ParseInLocation("20060102", field.Value, tz)
					if parseErr != nil {
						log.Printf("RSS Date parse error: %+v", parseErr)
					}

				case field.Name == "isbn":
					isbnLabel = field.Label
					isbns = append(isbns, field.Value)
				}

				//log.Printf("Field: %+v", field)
				if includeField == true {
					feedItem.Description += fmt.Sprintf("<p>%s: %s</p>", field.Label, field.Value)
				}
			}

			// now, add the first ISBN found, but only if the access URL doesn't already
			// contain the ISBN-10 representation of any of the ISBNs known for this item

			includeISBN := len(isbns) > 0

			for _, isbn := range isbns {

				// validate ISBN by length, and convert to ISBN-10 for search purposes

				switch len(isbn) {
				case 10:
					// already in the format we want

				case 13:
					// convert to ISBN-10
					isbn = isbn[len(isbn)-10:]

				default:
					log.Printf("RSS: ignoring possibly invalid ISBN: [%s]", isbn)
					continue
				}

				//log.Printf("checking for [%v] in [%v]...", isbn, feedItem.Source.Href)
				if strings.Contains(feedItem.Source.Href, isbn) == true {
					//log.Printf("found")
					includeISBN = false
					break
				}
			}

			if includeISBN == true {
				//log.Printf("including ISBN")
				feedItem.Description += fmt.Sprintf("<p>%s: %s</p>", isbnLabel, isbns[0])
			}

			//log.Printf("RSS ITEM: %+v", feedItem)
			items = append(items, &feedItem)
		}
	}
	return items

}
