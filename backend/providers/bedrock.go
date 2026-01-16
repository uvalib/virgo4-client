package providers

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/config"
)

type BedrockProvider struct {
	Region     string
	Model      string
	HTTPClient *http.Client
	Signer     *v4.Signer
	Config     aws.Config
}

func NewBedrockProvider(model string, client *http.Client) *BedrockProvider {
	// Load default AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		fmt.Printf("ERROR: unable to load SDK config, %v\n", err)
		return nil
	}

	if model == "" {
		model = "anthropic.claude-3-sonnet-20240229-v1:0"
	}

	return &BedrockProvider{
		Region:     cfg.Region,
		Model:      model,
		HTTPClient: client,
		Signer:     v4.NewSigner(),
		Config:     cfg,
	}
}

func (p *BedrockProvider) Name() string {
	return "bedrock"
}

// Anthropic-specific structs for Bedrock
type AnthropicRequest struct {
	AnthropicVersion string             `json:"anthropic_version"`
	MaxTokens        int                `json:"max_tokens"`
	System           string             `json:"system,omitempty"`
	Messages         []AnthropicMessage `json:"messages"`
}

type AnthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AnthropicResponse struct {
	Content []struct {
		Text string `json:"text"`
		Type string `json:"type"`
	} `json:"content"`
}

func (p *BedrockProvider) GetSuggestions(query string, contextItems []ContextItem) (AIResponse, error) {
	var emptyResponse AIResponse

	// Construct system prompt
	systemPrompt := "You are a helpful assistant that outputs JSON."

	// Construct user prompt
	prompt := fmt.Sprintf("You are a helpful academic librarian assistant. The user is searching for: \"%s\".\n", query)
	if len(contextItems) > 0 {
		prompt += "Here are the top search results found so far:\n"
		for i, item := range contextItems {
			prompt += fmt.Sprintf("%d. Title: %s\n   Snippet: %s\n", i+1, item.Title, item.Snippet)
		}
		prompt += "\nAnalyze the user's query and the search results.\n"
	} else {
		prompt += "\nThere are NO search results found for this query.\n"
	}

	prompt += "1. If the query contains an OBVIOUS spelling error (e.g. 'talahassee cultural conflicts' -> 'tallahassee cultural conflicts'), set 'didYouMean' to the FULL corrected query string.\n"
	prompt += "2. If the query is likely intentional or archaic (e.g. 'shakespere'), leave 'didYouMean' empty.\n"
	
	if len(contextItems) > 0 {
		prompt += "3. Populate 'suggestions' with 6-10 short, relevant, academic-style search phrases.\n"
		prompt += "   - IMPORTANT: Generate these suggestions using the USER'S ORIGINAL QUERY SPELLING, even if it appears misspelled. Do not automatically correct the spelling in the 'suggestions' list.\n"
	} else {
		prompt += "3. Populate 'suggestions' with 6-10 short, relevant, academic-style search phrases.\n"
		prompt += "   - Since there are no results, assume the query is misspelled. Generate refine search phrases using the CORRECTED spelling (if available).\n"
	}
	prompt += "\nRespond in JSON format."

	// Build Anthropic Request
	reqBody := AnthropicRequest{
		AnthropicVersion: "bedrock-2023-05-31",
		MaxTokens:        2000,
		System:           systemPrompt,
		Messages: []AnthropicMessage{
			{Role: "user", Content: prompt},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return emptyResponse, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Construct Bedrock Runtime URL
	url := fmt.Sprintf("https://bedrock-runtime.%s.amazonaws.com/model/%s/invoke", p.Region, p.Model)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return emptyResponse, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Sign the request
	creds, err := p.Config.Credentials.Retrieve(context.TODO())
	if err != nil {
		return emptyResponse, fmt.Errorf("failed to retrieve credentials: %w", err)
	}

	// Calculate payload hash
	hash := sha256.Sum256(jsonBody)
	payloadHash := hex.EncodeToString(hash[:])

	if err := p.Signer.SignHTTP(context.TODO(), creds, req, payloadHash, "bedrock", p.Region, time.Now()); err != nil {
		return emptyResponse, fmt.Errorf("failed to sign request: %w", err)
	}

	resp, err := p.HTTPClient.Do(req)
	if err != nil {
		return emptyResponse, fmt.Errorf("failed to invoke bedrock: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return emptyResponse, fmt.Errorf("bedrock returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	// Decode response using Anthropic struct
	var bedrockResp AnthropicResponse
	if err := json.NewDecoder(resp.Body).Decode(&bedrockResp); err != nil {
		return emptyResponse, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(bedrockResp.Content) == 0 {
		return emptyResponse, nil
	}

	content := bedrockResp.Content[0].Text
	var aiResponse AIResponse
	if err := json.Unmarshal([]byte(content), &aiResponse); err != nil {
		// Try to find JSON in text if pure JSON wasn't returned
		// (Sometimes models wrap in ```json ... ```)
		return emptyResponse, fmt.Errorf("failed to parse generated text as JSON: %w (content: %s)", err, content)
	}

	return aiResponse, nil
}
