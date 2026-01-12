package providers

// ContextItem represents a search result used as context for the AI
type ContextItem struct {
	Title   string `json:"title"`
	Snippet string `json:"snippet"`
}

// AIResponse represents the structured response from the AI provider
type AIResponse struct {
	DidYouMean  string   `json:"didYouMean"`
	Suggestions []string `json:"suggestions"`
}

// AIProvider defines the interface for different AI backends
type AIProvider interface {
	// GetSuggestions generates search suggestions based on the user query and search results context
	GetSuggestions(query string, contextItems []ContextItem) (AIResponse, error)
	
	// Name returns the name of the provider (e.g. "gemini", "openai")
	Name() string
}
