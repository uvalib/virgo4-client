# LLM Configuration Guide

The Virgo4 Client backend now supports multiple AI providers for generating search suggestions. You can switch between providers using command-line flags or environment variables (via the `run_local.sh` script).

## Supported Providers
- **Gemini** (Google) - *Default*
- **OpenAI** (Official API)
- **Grok** (xAI) - *Via OpenAI Compatibility*
- **AWS Bedrock** - *Via OpenAI Compatibility* (Requires an OpenAI-schema compatible endpoint or proxy like LiteLLM)

## Usage with `run_local.sh`

The easiest way to run the backend is using the helper script `run_local.sh`. You can configure it using environment variables.

### 1. Google Gemini (Default)
By default, the system uses the legacy Gemini implementation.
```bash
./run_local.sh
```
*Requires `gemini.key` file to exist.*

### 2. OpenAI
To use the official OpenAI API:
```bash
AI_PROVIDER=openai \
AI_KEY=sk-proj-your-key... \
AI_MODEL=gpt-4o \
./run_local.sh
```

### 3. Grok (xAI)
To use Grok, configure the OpenAI provider with Grok's base URL:
```bash
AI_PROVIDER=openai \
AI_KEY=your-grok-api-key \
AI_URL=https://api.grok.x.ai/v1 \
AI_MODEL=grok-beta \
./run_local.sh
```

### 4. AWS Bedrock
To use Bedrock, you must point to an endpoint that supports the OpenAI Chat Completions API schema.
*Note: If your Bedrock endpoint requires AWS Signature V4 (SigV4) authentication instead of an API Key, you may need to run a local proxy (like [LiteLLM](https://github.com/BerriAI/litellm)) that handles the signing.*

**Example with a local proxy (e.g. LiteLLM running on port 4000):**
```bash
AI_PROVIDER=openai \
AI_KEY=sk-1234 \
AI_URL=http://localhost:4000 \
AI_MODEL=bedrock/anthropic.claude-3-sonnet-20240229-v1:0 \
./run_local.sh
```

## Manual Configuration Flags

If you are running the binary directly (`./bin/v4srv.darwin`), use these flags:

| Flag | Description | Default |
|------|-------------|---------|
| `-aiprovider` | The provider type (`gemini`, `openai`) | `gemini` |
| `-aikey` | The API Key for the service | (Uses content of `gemini.key` if not set) |
| `-aiurl` | Base URL for the service (OpenAI provider only) | `https://api.openai.com/v1` |
| `-aimodel` | The model ID to use | `gpt-3.5-turbo` |

### Example via Binary
```bash
./bin/v4srv.darwin \
  -aiprovider=openai \
  -aikey=... \
  -aiurl=https://api.grok.x.ai/v1 \
  -aimodel=grok-beta \
  ... [other required flags]
```
