package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
)

// GetJournalDetails accepts an array of titles as POST data. Those titles are looked up and returned as JSON
func (svc *ServiceContext) GetJournalDetails(c *gin.Context) {
	var titlesReq struct {
		Titles []string `json:"titles"`
	}
	err := c.ShouldBindJSON(&titlesReq)
	if err != nil {
		log.Printf("ERROR: Unable to parse journal titles request: %s", err.Error())
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	type Item struct {
		ID           string   `json:"id"`
		Published    string   `json:"published,omitempty"`
		URL          []string `json:"url,omitempty"`
		Format       []string `json:"format,omitempty"`
		Availability string   `json:"availability"`
	}
	type Journal struct {
		Title string `json:"title"`
		Items []Item `json:"items"`
	}
	out := make([]Journal, 0)

	for _, title := range titlesReq.Titles {
		log.Printf("Get details for journal '%s'", title)
		escTitle := url.QueryEscape(title)
		escTitle = strings.ReplaceAll(escTitle, "%22", "\\%22")
		url := fmt.Sprintf("%s/%s/select?q=full_serials_title_f:\"%s\"", svc.Solr.URL, svc.Solr.Core, escTitle)
		respBytes, solrErr := svc.SolrGet(url)
		if solrErr != nil {
			c.String(solrErr.StatusCode, solrErr.Message)
			return
		}

		var parsed struct {
			Response struct {
				Docs []struct {
					ID           string   `json:"id"`
					Title        []string `json:"full_title_a"`
					Published    []string `json:"published_a"`
					URLSupp      []string `json:"url_supp_a"`
					URL          []string `json:"url_a"`
					Format       []string `json:"format_a"`
					Availability []string `json:"uva_availability_a"`
				} `json:"docs"`
			} `json:"response"`
		}

		if err := json.Unmarshal(respBytes, &parsed); err != nil {
			log.Printf("ERROR: Unable to parse solr response: %s. Skipping", err.Error())
			continue
		}

		journal := Journal{Title: title, Items: make([]Item, 0)}
		docs := parsed.Response.Docs
		for _, doc := range docs {
			urls := make([]string, 0)
			urls = append(urls, doc.URL...)
			urls = append(urls, doc.URLSupp...)
			item := Item{ID: doc.ID, Published: getValue(doc.Published),
				Format: doc.Format, Availability: getValue(doc.Availability)}
			if item.Availability == "Online" {
				item.URL = urls
			}
			journal.Items = append(journal.Items, item)
		}

		out = append(out, journal)
	}

	c.JSON(http.StatusOK, out)
}

func getValue(raw []string) string {
	if len(raw) > 0 {
		return raw[0]
	}
	return ""
}

// BrowseJournals will do the initial solr query to find journals where title starts
// with the passed query string
func (svc *ServiceContext) BrowseJournals(c *gin.Context) {
	title := c.Query("title")
	log.Printf("Browse journals where title starts with %s", title)

	// This is the new URL. it is case sensitive.
	url := fmt.Sprintf("%s/%s/terms?terms.fl=full_serials_title_f&terms.sort=index&terms.lower=%s",
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
			JournalTitleSort []interface{} `json:"full_serials_title_f"`
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
