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

type OpenAIProvider struct {
	BaseURL    string
	APIKey     string
	Model      string
	HTTPClient *http.Client
}

func NewOpenAIProvider(baseURL string, apiKey string, model string, client *http.Client) *OpenAIProvider {
	// Default to official OpenAI API if no URL provided
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}
	// Default model if none provided
	if model == "" {
		model = "gpt-3.5-turbo"
	}
	return &OpenAIProvider{
		BaseURL:    strings.TrimRight(baseURL, "/"),
		APIKey:     apiKey,
		Model:      model,
		HTTPClient: client,
	}
}

func (p *OpenAIProvider) Name() string {
	return "openai"
}

// OpenAI-specific structs
type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIRequest struct {
	Model       string          `json:"model"`
	Messages    []OpenAIMessage `json:"messages"`
	ResponseFormat *OpenAIResponseFormat `json:"response_format,omitempty"`
}

type OpenAIResponseFormat struct {
	Type string `json:"type"`
	JsonSchema *OpenAIJsonSchema `json:"json_schema,omitempty"`

}

type OpenAIJsonSchema struct {
	Name   string                 `json:"name"`
	Schema map[string]interface{} `json:"schema"`
	Strict bool                   `json:"strict,omitempty"`
}

type OpenAIChoice struct {
	Message OpenAIMessage `json:"message"`
}

type OpenAIResponse struct {
	Choices []OpenAIChoice `json:"choices"`
}

func (p *OpenAIProvider) GetSuggestions(query string, contextItems []ContextItem) (AIResponse, error) {
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

	if len(contextItems) > 0 {
		promptBuilder.WriteString("3. Populate 'suggestions' with 6-10 short, relevant, academic-style search phrases.\n")
		promptBuilder.WriteString("   - IMPORTANT: Generate these suggestions using the USER'S ORIGINAL QUERY SPELLING, even if it appears misspelled. Do not automatically correct the spelling in the 'suggestions' list.\n")
	} else {
		promptBuilder.WriteString("3. Populate 'suggestions' with 6-10 short, relevant, academic-style search phrases.\n")
		promptBuilder.WriteString("   - Since there are no results, assume the query is misspelled. Generate refine search phrases using the CORRECTED spelling (if available).\n")
	}
	promptBuilder.WriteString("\nRespond in JSON format.")

	// OpenAI Request
	reqBody := OpenAIRequest{
		Model: p.Model,
		Messages: []OpenAIMessage{
			{Role: "system", Content: "You are a helpful assistant that outputs JSON."},
			{Role: "user", Content: promptBuilder.String()},
		},
		ResponseFormat: &OpenAIResponseFormat{
			Type: "json_object",
		},
	}
	
	// Better structured output if models support it (e.g. gpt-4o, gpt-4-turbo)
	// For generic compatibility (Grok, Bedrock), we'll stick to simple "json_object" mode and valid prompts.

	jsonBody, _ := json.Marshal(reqBody)
	url := fmt.Sprintf("%s/chat/completions", p.BaseURL)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return emptyResponse, fmt.Errorf("failed to create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	if p.APIKey != "" {
		httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.APIKey))
	}

	resp, err := p.HTTPClient.Do(httpReq)
	if err != nil {
		return emptyResponse, fmt.Errorf("failed to contact AI service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return emptyResponse, fmt.Errorf("AI service returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var openAIResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return emptyResponse, fmt.Errorf("failed to process AI response: %w", err)
	}

	if len(openAIResp.Choices) == 0 {
		return emptyResponse, nil
	}

	content := openAIResp.Choices[0].Message.Content
	var aiResponse AIResponse
	if err := json.Unmarshal([]byte(content), &aiResponse); err != nil {
		return emptyResponse, fmt.Errorf("failed to parse generated text as JSON: %w", err)
	}

	return aiResponse, nil
}
