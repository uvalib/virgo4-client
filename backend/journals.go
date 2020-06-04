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

	type AccessURL struct {
		URL      string `json:"url,omitempty"`
		Item     string `json:"item,omitempty"`
		Provider string `json:"provider,omitempty"`
	}
	type Item struct {
		ID           string      `json:"id"`
		Published    string      `json:"published,omitempty"`
		URL          []AccessURL `json:"accessURL,omitempty"`
		Format       []string    `json:"format,omitempty"`
		Availability string      `json:"availability"`
		CallNumber   []string    `json:"callNumber,omitempty"`
		Location     []string    `json:"location,omitempty"`
	}
	type Journal struct {
		Title     string   `json:"title"`
		AltTitles []string `json:"alt_titles,omitempty"`
		Items     []Item   `json:"items"`
	}
	out := make([]Journal, 0)

	for _, title := range titlesReq.Titles {
		log.Printf("Get details for journal '%s'", title)
		escTitle := url.QueryEscape(title)
		escTitle = strings.ReplaceAll(escTitle, "%22", "\\%22")
		url := fmt.Sprintf("select?q=full_serials_title_f:\"%s\"", escTitle)
		respBytes, solrErr := svc.SolrGet(url)
		if solrErr != nil {
			c.String(solrErr.StatusCode, solrErr.Message)
			return
		}
		// log.Printf("======== %s ===================", respBytes)

		var parsed struct {
			Response struct {
				Docs []struct {
					ID           string   `json:"id"`
					Title        []string `json:"full_title_a"`
					AltTitles    []string `json:"journal_title_addnl_a"`
					Published    []string `json:"published_a"`
					URL          []string `json:"url_a"`
					URLLabel     []string `json:"url_label_a"`
					URLProvider  []string `json:"data_source_a"`
					Location     []string `json:"location_a"`
					Format       []string `json:"format_a"`
					Availability []string `json:"uva_availability_a"`
					CallNumber   []string `json:"lc_call_number_a"`
				} `json:"docs"`
			} `json:"response"`
		}

		if err := json.Unmarshal(respBytes, &parsed); err != nil {
			log.Printf("ERROR: Unable to parse solr response: %s. Skipping", err.Error())
			continue
		}

		journal := Journal{Title: title, AltTitles: make([]string, 0), Items: make([]Item, 0)}
		docs := parsed.Response.Docs
		for _, doc := range docs {
			journal.AltTitles = append(journal.AltTitles, doc.AltTitles...)
			urls := make([]string, 0)
			urls = append(urls, doc.URL...)
			urlLabels := make([]string, 0)
			urlLabels = append(urlLabels, doc.URLLabel...)
			item := Item{ID: doc.ID, Published: getValue(doc.Published),
				Format: doc.Format, Availability: getValue(doc.Availability)}
			item.Location = make([]string, 0)
			item.Location = append(item.Location, doc.Location...)
			item.CallNumber = make([]string, 0)
			item.CallNumber = append(item.CallNumber, doc.CallNumber...)
			if item.Availability == "Online" {
				if len(urlLabels) < len(urls) {
					log.Printf("ERROR: url_label_a missing or incomplete")
					urlLabels = make([]string, 0)
					for idx := range urls {
						urlLabels = append(urlLabels, fmt.Sprintf("Copy %d", idx+1))
					}
				}
				provider := getValue(doc.URLProvider)
				item.URL = make([]AccessURL, 0)
				for idx, url := range urls {
					newURL := AccessURL{URL: url, Item: urlLabels[idx], Provider: provider}
					item.URL = append(item.URL, newURL)
				}
			}
			journal.AltTitles = unique(journal.AltTitles)
			journal.Items = append(journal.Items, item)
		}

		out = append(out, journal)
	}

	c.JSON(http.StatusOK, out)
}

func unique(values []string) []string {
	keys := make(map[string]bool)
	list := []string{}
	for _, entry := range values {
		if _, value := keys[entry]; !value {
			keys[entry] = true
			list = append(list, entry)
		}
	}
	return list
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
	url := fmt.Sprintf("terms?terms.fl=full_serials_title_f&terms.sort=index&terms.lower=%s", url.QueryEscape(title))
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
