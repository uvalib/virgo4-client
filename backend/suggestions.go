package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type SuggestionRequest struct {
	OriginalQuery string `json:"originalQuery"`
	ContextItems  []struct {
		Title   string `json:"title"`
		Snippet string `json:"snippet"`
	} `json:"contextItems"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiRequest struct {
	Contents         []GeminiContent   `json:"contents"`
	GenerationConfig *GenerationConfig `json:"generationConfig,omitempty"`
}

type GenerationConfig struct {
	ResponseMimeType string        `json:"responseMimeType"`
	ResponseSchema   *GeminiSchema `json:"responseSchema,omitempty"`
}

type GeminiSchema struct {
	Type       string                   `json:"type"`
	Items      *GeminiSchema            `json:"items,omitempty"`
	Properties map[string]*GeminiSchema `json:"properties,omitempty"`
}

type AIResponse struct {
	DidYouMean  string   `json:"didYouMean"`
	Suggestions []string `json:"suggestions"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content GeminiContent `json:"content"`
	} `json:"candidates"`
}

// GetAISuggestions generates search suggestions using Gemini
func (svc *ServiceContext) GetAISuggestions(c *gin.Context) {
	if svc.GeminiKey == "" {
		log.Printf("AISuggestions: GeminiKey is not configured")
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI suggestions not available"})
		return
	}

	var req SuggestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("AISuggestions: Generating suggestions for query '%s' with %d context items", req.OriginalQuery, len(req.ContextItems))

	// Construct the prompt
	var promptBuilder strings.Builder
	promptBuilder.WriteString(fmt.Sprintf("You are a helpful academic librarian assistant. The user is searching for: \"%s\".\n", req.OriginalQuery))
	
	if len(req.ContextItems) > 0 {
		promptBuilder.WriteString("Here are the top search results found so far:\n")
		for i, item := range req.ContextItems {
			promptBuilder.WriteString(fmt.Sprintf("%d. Title: %s\n   Snippet: %s\n", i+1, item.Title, item.Snippet))
		}
		promptBuilder.WriteString("\nAnalyze the user's query and the search results.\n")
	} else {
		promptBuilder.WriteString("\nThere are NO search results found for this query.\n")
	}

	promptBuilder.WriteString("1. If the query contains an OBVIOUS spelling error (e.g. 'talahassee' -> 'tallahassee'), set 'didYouMean' to the corrected term.\n")
	promptBuilder.WriteString("2. If the query is likely intentional or archaic (e.g. 'shakespere'), leave 'didYouMean' empty.\n")
	
	if len(req.ContextItems) > 0 {
		promptBuilder.WriteString("3. Populate 'suggestions' with 6-10 short, relevant, academic-style search phrases.\n")
		promptBuilder.WriteString("   - IMPORTANT: Generate these suggestions using the USER'S ORIGINAL QUERY SPELLING, even if it appears misspelled. Do not automatically correct the spelling in the 'suggestions' list.\n")
	} else {
		promptBuilder.WriteString("3. Populate 'suggestions' with 6-10 short, relevant, academic-style search phrases.\n")
		promptBuilder.WriteString("   - Since there are no results, assume the query is misspelled. Generate refine search phrases using the CORRECTED spelling (if available).\n")
	}

	// Call Gemini API
	cleanKey := strings.TrimSpace(svc.GeminiKey)
	geminiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=%s", cleanKey)

	geminiReqBody := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{Text: promptBuilder.String()},
				},
			},
		},
		GenerationConfig: &GenerationConfig{
			ResponseMimeType: "application/json",
			ResponseSchema: &GeminiSchema{
				Type: "OBJECT",
				Properties: map[string]*GeminiSchema{
					"didYouMean": {Type: "STRING"},
					"suggestions": {
						Type: "ARRAY",
						Items: &GeminiSchema{Type: "STRING"},
					},
				},
			},
		},
	}

	jsonBody, _ := json.Marshal(geminiReqBody)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	httpReq, err := http.NewRequestWithContext(ctx, "POST", geminiURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		log.Printf("AISuggestions: Failed to create request: %s", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := svc.HTTPClient.Do(httpReq)
	if err != nil {
		log.Printf("AISuggestions: Call to Gemini failed: %s", err.Error())
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to contact AI service"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("AISuggestions: Gemini API returned status %d: %s", resp.StatusCode, string(bodyBytes))
		log.Printf("AISuggestions: Prompt sent: %s", promptBuilder.String())
		c.JSON(http.StatusBadGateway, gin.H{"error": "AI service returned error"})
		return
	}

	var geminiResp GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		log.Printf("AISuggestions: Failed to decode Gemini response: %s", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process AI response"})
		return
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		log.Printf("AISuggestions: No candidates returned from Gemini")
		c.JSON(http.StatusOK, gin.H{"suggestions": []string{}})
		return
	}

	rawText := geminiResp.Candidates[0].Content.Parts[0].Text

	// ... previous code ...
	var aiResponse AIResponse
	if err := json.Unmarshal([]byte(rawText), &aiResponse); err != nil {
		log.Printf("AISuggestions: Failed to parse generated text as JSON: %s. Text was: %s", err.Error(), rawText)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse suggestions"})
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
