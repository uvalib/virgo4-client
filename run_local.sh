#!/bin/bash


# Add homebrew to path for go
export PATH="/opt/homebrew/bin:$PATH"

# Build the backend for macOS
echo "Building backend..."
make darwin

# Set default values
# You can override these by setting environment variables before running the script
# Example: AI_PROVIDER=openai ./run_local.sh

PROVIDER=${AI_PROVIDER:-bedrock}
API_KEY=${AI_KEY:-$(cat gemini.key)}
# Use cat gemini.key as default fallback even for 'aikey' flag if not provided.
# Bedrock does not use this key, but the script passes it.
# Note: For OpenAI/Grok, you'll need to provide the actual key via AI_KEY env var

# Default URLs
SEARCH_API="https://search-ws.internal.lib.virginia.edu"
ILS_API="https://ils-connector.lib.virginia.edu"
FEEDBACK_EMAIL="virgo4-feedback@virginia.edu"

# Construct the command
CMD="./bin/v4srv.darwin \
  -search='$SEARCH_API' \
  -ils '$ILS_API' \
  -feedbackemail '$FEEDBACK_EMAIL' \
  -jwtkey $(cat jwt.key) \
  -aiprovider=$PROVIDER \
  -aikey=$API_KEY"

# Add optional AI flags if set
if [ ! -z "$AI_URL" ]; then
  CMD="$CMD -aiurl=$AI_URL"
fi

if [ ! -z "$AI_MODEL" ]; then
  CMD="$CMD -aimodel=$AI_MODEL"
elif [ "$PROVIDER" = "bedrock" ]; then
  # Default Bedrock Model if not specified
  CMD="$CMD -aimodel=anthropic.claude-3-sonnet-20240229-v1:0"
fi

echo "Running service with provider: $PROVIDER"
echo "Command: $CMD"

# Execute
# Execute
eval $CMD "$@"
