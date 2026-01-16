package providers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type GeminiProvider struct {
	APIKey     string
	HTTPClient *http.Client
}

func NewGeminiProvider(apiKey string, client *http.Client) *GeminiProvider {
	return &GeminiProvider{
		APIKey:     apiKey,
		HTTPClient: client,
	}
}

func (p *GeminiProvider) Name() string {
	return "gemini"
}

func (p *GeminiProvider) GetModel() string {
	return "gemini-2.5-flash-lite"
}

// Gemini-specific structs
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

type GeminiResponse struct {
	Candidates []struct {
		Content GeminiContent `json:"content"`
	} `json:"candidates"`
}

func (p *GeminiProvider) GetSuggestions(query string, contextItems []ContextItem) (AIResponse, error) {
	var emptyResponse AIResponse

	// Construct the prompt
	var promptBuilder strings.Builder
	promptBuilder.WriteString(fmt.Sprintf("You are a helpful academic librarian assistant. The user is searching for: \"%s\".\n", query))

	if len(contextItems) > 0 {
		promptBuilder.WriteString("Here are the top search results found so far:\n")
		for i, item := range contextItems {
			promptBuilder.WriteString(fmt.Sprintf("%d. Title: %s\n   Snippet: %s\n", i+1, item.Title, item.Snippet))
		}
		promptBuilder.WriteString("\nAnalyze the user's query and the search results.\n")
	} else {
		promptBuilder.WriteString("\nThere are NO search results found for this query.\n")
	}

	promptBuilder.WriteString("1. If the query contains an OBVIOUS spelling error (e.g. 'talahassee cultural conflicts' -> 'tallahassee cultural conflicts'), set 'didYouMean' to the FULL corrected query string.\n")
	promptBuilder.WriteString("2. If the query is likely intentional or archaic (e.g. 'shakespere'), leave 'didYouMean' empty.\n")

	promptBuilder.WriteString("\nSupported Search Syntax (Solr/Lucene style):\n")
	promptBuilder.WriteString("- Use quotation marks for exact phrases: \"grapes of wrath\"\n")
	promptBuilder.WriteString("- Use uppercase boolean operators: AND, OR, NOT (e.g. kyoto NOT protocol)\n")
	promptBuilder.WriteString("- Use parentheses to group parts: (calico OR \"tortoise shell\") AND cats\n")
	promptBuilder.WriteString("- Use asterisk (*) for wildcard searches: octo* (matches octopus, octothorpe)\n")
	promptBuilder.WriteString("- NOTE: Nested parentheses are NOT supported.\n")

	if len(contextItems) > 0 {
		promptBuilder.WriteString("3. Populate 'suggestions' with 6-10 short, relevant, academic-style search phrases.\n")
		promptBuilder.WriteString("   - Suggestions should strictly follow the supported syntax usage rules above if using complex logic.\n")
		promptBuilder.WriteString("   - IMPORTANT: Generate these suggestions using the USER'S ORIGINAL QUERY SPELLING, even if it appears misspelled. Do not automatically correct the spelling in the 'suggestions' list.\n")
	} else {
		promptBuilder.WriteString("3. Populate 'suggestions' with 6-10 short, relevant, academic-style search phrases.\n")
		promptBuilder.WriteString("   - Suggestions should strictly follow the supported syntax usage rules above if using complex logic.\n")
		promptBuilder.WriteString("   - Since there are no results, assume the query is misspelled. Generate refine search phrases using the CORRECTED spelling (if available).\n")
	}

	// Call Gemini API
	cleanKey := strings.TrimSpace(p.APIKey)
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
		return emptyResponse, fmt.Errorf("failed to create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := p.HTTPClient.Do(httpReq)
	if err != nil {
		return emptyResponse, fmt.Errorf("failed to contact AI service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return emptyResponse, fmt.Errorf("AI service returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var geminiResp GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return emptyResponse, fmt.Errorf("failed to process AI response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		// Return empty suggestions, no error
		return emptyResponse, nil
	}

	rawText := geminiResp.Candidates[0].Content.Parts[0].Text

	var aiResponse AIResponse
	if err := json.Unmarshal([]byte(rawText), &aiResponse); err != nil {
		return emptyResponse, fmt.Errorf("failed to parse generated text as JSON: %w", err)
	}

	return aiResponse, nil
}
