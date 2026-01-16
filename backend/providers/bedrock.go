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
	"strings"
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

func (p *BedrockProvider) GetModel() string {
	return p.Model
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

// Mistral-specific structs for Bedrock
type MistralRequest struct {
	Prompt    string  `json:"prompt"`
	MaxTokens int     `json:"max_tokens"`
	Temperature float64 `json:"temperature,omitempty"`
}

type MistralResponse struct {
	Outputs []struct {
		Text       string `json:"text"`
		StopReason string `json:"stop_reason"`
	} `json:"outputs"`
}

// Gemma-specific structs
type GemmaRequest struct {
	InputText            string `json:"inputText"`
	TextGenerationConfig struct {
		MaxTokenCount int     `json:"maxTokenCount"`
		Temperature   float64 `json:"temperature"`
		TopP          float64 `json:"topP"`
	} `json:"textGenerationConfig"`
}

type GemmaResponse struct {
	Results []struct {
		OutputText string `json:"outputText"`
	} `json:"results"`
}

func (p *BedrockProvider) GetSuggestions(query string, contextItems []ContextItem) (AIResponse, error) {
	var emptyResponse AIResponse

	// Construct prompts
	systemPromptContent := "You are a helpful assistant that outputs JSON."
	
	// User prompt construction
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

	var jsonBody []byte
	var err error

	// Branch based on Model ID
	modelLower := strings.ToLower(p.Model)
	if strings.Contains(modelLower, "mistral") {
		// Mistral Format
		// Format: <s>[INST] {System} {User} [/INST]
		fullPrompt := fmt.Sprintf("<s>[INST] %s\n\n%s [/INST]", systemPromptContent, prompt)
		
		mistralReq := MistralRequest{
			Prompt:      fullPrompt,
			MaxTokens:   2000,
			Temperature: 0.5,
		}
		jsonBody, err = json.Marshal(mistralReq)

	} else if strings.Contains(modelLower, "gemma") {
		// Gemma Format (Amazon Bedrock usually requires 'messages' for conversational models)
		
		// Gemma likely doesn't want 'anthropic_version' or 'system' top-level if it's not anthropic.
		// Let's create a specific simple struct for Gemma Messages.
		type GemmaMessage struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		}
		type GemmaMessagesRequest struct {
			Messages []GemmaMessage `json:"messages"`
			MaxTokens int           `json:"maxTokens,omitempty"` // Note: Common casing variation
			Temperature float64     `json:"temperature,omitempty"`
			TopP        float64     `json:"topP,omitempty"`
		}
		
		gReq := GemmaMessagesRequest{
			Messages: []GemmaMessage{
				{Role: "user", Content: fmt.Sprintf("%s\n\n%s", systemPromptContent, prompt)},
			},
			MaxTokens:   2000,
			Temperature: 0.5,
			TopP:        0.9,
		}
		jsonBody, err = json.Marshal(gReq)

	} else {
		// Default to Anthropic (Claude) Format
		reqBody := AnthropicRequest{
			AnthropicVersion: "bedrock-2023-05-31",
			MaxTokens:        2000,
			System:           systemPromptContent,
			Messages: []AnthropicMessage{
				{Role: "user", Content: prompt},
			},
		}
		jsonBody, err = json.Marshal(reqBody)
	}

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

	var content string

	// Branch response parsing
	if strings.Contains(modelLower, "mistral") {
		var mistralResp MistralResponse
		if err := json.NewDecoder(resp.Body).Decode(&mistralResp); err != nil {
			return emptyResponse, fmt.Errorf("failed to decode mistral response: %w", err)
		}
		if len(mistralResp.Outputs) > 0 {
			content = mistralResp.Outputs[0].Text
		}
	} else if strings.Contains(modelLower, "gemma") {
		// Gemma Response (Converse API style or similar)
		// Often returns 'output' -> 'message' -> 'content' OR 'choices'
		// Let's try to parse as a generic structure or reuse Anthropic response if similar
		// But usually it's { "output": { "message": { "content": [...] } } } or similar
		// The error message didn't give hints on response, only request.
		// Let's look for standard 'choices' first as many use that, or the 'output' field.
		
		// Temporary generic map decode to find content until we confirm 100%
		var result map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return emptyResponse, fmt.Errorf("failed to decode gemma response: %w", err)
		}
		
		// Verify fields
		// 1. Try 'choices' (OpenAI style)
		if choices, ok := result["choices"].([]interface{}); ok && len(choices) > 0 {
			if choice, ok := choices[0].(map[string]interface{}); ok {
				if msg, ok := choice["message"].(map[string]interface{}); ok {
					if contentStr, ok := msg["content"].(string); ok {
						content = contentStr
					}
				}
			}
		}
		// 2. Try 'outputs' (Mistral/Titan style)
		if content == "" {
			if outputs, ok := result["outputs"].([]interface{}); ok && len(outputs) > 0 {
				if output, ok := outputs[0].(map[string]interface{}); ok {
					if text, ok := output["text"].(string); ok {
						content = text
					}
				}
			}
		}
		// 3. Try 'results' (Original Generic)
		if content == "" {
			if results, ok := result["results"].([]interface{}); ok && len(results) > 0 {
				if res, ok := results[0].(map[string]interface{}); ok {
					if text, ok := res["outputText"].(string); ok {
						content = text
					}
				}
			}
		}
		
	} else {
		// Default to Anthropic
		var bedrockResp AnthropicResponse
		if err := json.NewDecoder(resp.Body).Decode(&bedrockResp); err != nil {
			return emptyResponse, fmt.Errorf("failed to decode anthropic response: %w", err)
		}
		if len(bedrockResp.Content) > 0 {
			content = bedrockResp.Content[0].Text
		}
	}

	if content == "" {
		return emptyResponse, nil
	}

	var aiResponse AIResponse
	// Clean up content from potential markdown markers like ```json
	content = strings.TrimSpace(content)
	if strings.HasPrefix(content, "```json") {
		content = strings.TrimPrefix(content, "```json")
		content = strings.TrimSuffix(content, "```")
	} else if strings.HasPrefix(content, "```") {
		content = strings.TrimPrefix(content, "```")
		content = strings.TrimSuffix(content, "```")
	}

	if err := json.Unmarshal([]byte(content), &aiResponse); err != nil {
		return emptyResponse, fmt.Errorf("failed to parse generated text as JSON: %w (content: %s)", err, content)
	}

	return aiResponse, nil
}
