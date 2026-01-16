# LLM Configuration Guide

The Virgo4 Client backend supports multiple AI providers for generating search suggestions. You can switch between providers using command-line flags or environment variables (via the `run_local.sh` script).

## Supported Providers
- **AWS Bedrock** (Native Support) - *Default*
  - Supported Models: Anthropic Claude 3, Mistral AI (Mistral Large, Voxtral, etc.)
- **Gemini** (Google) - *Legacy Default*
- **OpenAI** (Official API)
- **Grok** (xAI) - *Via OpenAI Compatibility*

## Usage with `run_local.sh`

The easiest way to run the backend is using the helper script `run_local.sh`.

### 1. AWS Bedrock (Default)
The system defaults to using AWS Bedrock. You need valid AWS credentials in your environment.
The client uses the standard AWS SDK, so it automatically loads credentials from `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` environment variables or your `~/.aws/config` profiles.

**Anthropic Claude 3 (Default Model)**
```bash
./run_local.sh
# Defaults to: anthropic.claude-3-sonnet-20240229-v1:0
```

**Mistral AI Models**
To use Mistral models (which use a different prompting format), just specify the model ID. The backend automatically detects "mistral" in the name and adjusts accordingly.
```bash
./run_local.sh -aimodel=mistral.voxtral-mini-3b-2507
```

**Google Gemma Models**
To use Gemma models (which also use a specific payload), specify the model ID. The backend detects "gemma" models.
```bash
./run_local.sh -aimodel=google.gemma-3-4b-it
```

### 2. Google Gemini
To use the legacy Gemini implementation:
```bash
AI_PROVIDER=gemini \
./run_local.sh
```
*Requires `gemini.key` file to exist or `AI_KEY` environment variable.*

### 3. OpenAI
To use the official OpenAI API:
```bash
AI_PROVIDER=openai \
AI_KEY=sk-proj-your-key... \
AI_MODEL=gpt-4o \
./run_local.sh
```

### 4. Grok (xAI)
To use Grok, configure the OpenAI provider with Grok's base URL:
```bash
AI_PROVIDER=openai \
AI_KEY=your-grok-api-key \
AI_URL=https://api.grok.x.ai/v1 \
AI_MODEL=grok-beta \
./run_local.sh
```

## Manual Configuration Flags

If you are running the binary directly (`./bin/v4srv.darwin`), use these flags:

| Flag | Description | Default |
|------|-------------|---------|
| `-aiprovider` | The provider type (`bedrock`, `gemini`, `openai`) | `gemini` (binary default), `bedrock` (script default) |
| `-aikey` | The API Key for the service | (Required for Gemini/OpenAI, not used for Bedrock) |
| `-aiurl` | Base URL for the service (OpenAI provider only) | `https://api.openai.com/v1` |
| `-aimodel` | The model ID to use | Configurable (defaults vary by provider/script) |

### Troubleshooting

- **Database Connection Refused**: If you see `failed to initialize database`, your local Postgres is not running.
  ```bash
  brew services restart postgresql@14
  ```
- **Go Command Not Found**: The `run_local.sh` script attempts to add `/opt/homebrew/bin` to your PATH. If builds fail, check your Go installation.
