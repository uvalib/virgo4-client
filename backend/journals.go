package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)

// BrowseJournals will do the initial solr query to find journals where title starts
// with the passed query string
func (svc *ServiceContext) BrowseJournals(c *gin.Context) {
	title := c.Query("title")
	log.Printf("Browse journals where title starts with %s", title)

	url := fmt.Sprintf("%s/%s/terms?terms.fl=journal_title_sort&terms.sort=index&terms.lower=%s",
		svc.Solr.URL, svc.Solr.Core, url.QueryEscape(title))
	respBytes, err := svc.SolrGet(url)
	if err != nil {
		log.Printf("ERROR: Solr request for %s failed: %s", title, err.Message)
		c.String(http.StatusInternalServerError, err.Message)
		return
	}

	// Structure to contain the solr response. The key data is in the title_sort
	// array, and it is mixed. Alternates between a string title and int count
	var solrResp struct {
		Terms struct {
			JournalTitleSort []interface{} `json:"journal_title_sort"`
		} `json:"terms"`
	}

	if err := json.Unmarshal(respBytes, &solrResp); err != nil {
		log.Printf("ERROR: unable to parse Solr response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	// Once the response has been parsed, transform it into something more useful for the client
	type solrMatch struct {
		Title string `json:"title"`
		Count int    `json:"count"`
	}
	resp := make([]*solrMatch, 0)
	var item *solrMatch
	for idx, data := range solrResp.Terms.JournalTitleSort {
		if idx%2 == 0 {
			item = new(solrMatch)
			item.Title = data.(string)
		} else {
			cnt := data.(float64)
			item.Count = int(cnt)
			resp = append(resp, item)
		}
	}
	c.JSON(http.StatusOK, resp)
}
