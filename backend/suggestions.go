package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/uvalib/virgo4-client/backend/providers"
)

type SuggestionRequest struct {
	OriginalQuery string `json:"originalQuery"`
	ContextItems  []struct {
		Title   string `json:"title"`
		Snippet string `json:"snippet"`
	} `json:"contextItems"`
}

// GetAISuggestions generates search suggestions using the configured AI Provider
func (svc *ServiceContext) GetAISuggestions(c *gin.Context) {
	if svc.AIProvider == nil {
		log.Printf("AISuggestions: AI Provider is not configured")
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI suggestions not available"})
		return
	}

	var req SuggestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("AISuggestions: Generating suggestions for query '%s' with %d context items using provider '%s'", 
		req.OriginalQuery, len(req.ContextItems), svc.AIProvider.Name())

	// Convert context items to provider format
	providerContext := make([]providers.ContextItem, len(req.ContextItems))
	for i, item := range req.ContextItems {
		providerContext[i] = providers.ContextItem{
			Title:   item.Title,
			Snippet: item.Snippet,
		}
	}

	// Call AI Provider
	aiResponse, err := svc.AIProvider.GetSuggestions(req.OriginalQuery, providerContext)
	if err != nil {
		log.Printf("AISuggestions: Provider '%s' failed: %s", svc.AIProvider.Name(), err.Error())
		c.JSON(http.StatusBadGateway, gin.H{"error": "AI service returned error"})
		return
	}

	// Verify that each suggestion actually returns results
	// Only verify the 'Suggestions' list, 'DidYouMean' is usually a direct correction
	if len(aiResponse.Suggestions) > 0 {
		verifiedSuggestions := make([]string, 0, len(aiResponse.Suggestions))
		type resultCheck struct {
			term  string
			valid bool
		}
		checkChan := make(chan resultCheck, len(aiResponse.Suggestions))

		for _, s := range aiResponse.Suggestions {
			go func(term string) {
				valid := svc.verifySuggestionHasResults(term)
				checkChan <- resultCheck{term: term, valid: valid}
			}(s)
		}

		// Collect results
		resultsMap := make(map[string]bool)
		for i := 0; i < len(aiResponse.Suggestions); i++ {
			res := <-checkChan
			resultsMap[res.term] = res.valid
		}

		// Rebuild list in original order to maintain AI ranking
		for _, s := range aiResponse.Suggestions {
			if resultsMap[s] {
				verifiedSuggestions = append(verifiedSuggestions, s)
			}
		}
		aiResponse.Suggestions = verifiedSuggestions
	}

	c.JSON(http.StatusOK, aiResponse)
}

type VirgoSearchRequest struct {
	Query      string `json:"query"`
	Pagination struct {
		Start int `json:"start"`
		Rows  int `json:"rows"`
	} `json:"pagination"`
}

type VirgoSearchResponse struct {
	TotalHits int `json:"total_hits"`
}

func (svc *ServiceContext) verifySuggestionHasResults(query string) bool {
	if svc.SearchAPI == "" {
		return true // Fail open if search API is not configured
	}

	reqBody := VirgoSearchRequest{
		Query: query,
	}
	reqBody.Pagination.Start = 0
	reqBody.Pagination.Rows = 0 // We only care about the count

	jsonBody, _ := json.Marshal(reqBody)
	searchURL := fmt.Sprintf("%s/api/search", svc.SearchAPI)

	httpReq, err := http.NewRequest("POST", searchURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		log.Printf("AISuggestions: Failed to create verification request: %s", err.Error())
		return true // Fail open
	}
	httpReq.Header.Set("Content-Type", "application/json")

	// Use a short timeout for verification
	client := *svc.HTTPClient
	client.Timeout = 2 * time.Second

	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("AISuggestions: Verification check failed for '%s': %s", query, err.Error())
		return true // Fail open
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("AISuggestions: Verification check returned status %d for '%s'", resp.StatusCode, query)
		return true // Fail open
	}

	var searchResp VirgoSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		log.Printf("AISuggestions: Failed to decode verification response: %s", err.Error())
		return true // Fail open
	}

	return searchResp.TotalHits > 0
}
