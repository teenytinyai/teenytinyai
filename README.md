# TeenyTiny AI

A lightweight, OpenAI-compatible chat completions API built for Cloudflare Workers and Node.js.

## What is this?

TeenyTiny AI is a drop-in replacement for OpenAI's chat completions API that can run anywhere - from Cloudflare's edge network to your local development environment. It's designed for developers who need a simple, reliable chat API that works with existing OpenAI-compatible tools and libraries.

**Who is this for?** Developers building AI-powered applications who want:
- A lightweight alternative to OpenAI's API
- Edge deployment capabilities with Cloudflare Workers  
- Local development without external dependencies
- Full control over their chat completion service

**Why choose TeenyTiny AI over alternatives?**
- 🚀 **Edge-first**: Designed for Cloudflare Workers with global low latency
- 🔧 **OpenAI Compatible**: Drop-in replacement for existing apps
- 📦 **Lightweight**: Minimal dependencies, fast cold starts
- 🛠️ **Developer Friendly**: Easy local development and testing
- 🔒 **Self-hosted**: Keep your data under your control

## Available Models

TeenyTiny AI includes four AI models accessible via the OpenAI-compatible API:

- **`echo`** - Simple text echoing for testing and debugging
- **`eliza`** - Classic Rogerian psychotherapist simulation (MIT 1966)
- **`parry`** - Paranoid patient simulation with emotional states (Stanford 1972)
- **`racter`** - Surreal stream-of-consciousness text generator (1980s)

For detailed information about each model's origins, algorithms, and behavior patterns, see **[MODELS.md](MODELS.md)**.

## Command Line Interface

TeenyTiny AI includes a simple CLI client for testing and interacting with your API:

```bash
# Show available models and usage
./tt

# One-shot completion
./tt echo "Hello, world!"

# Interactive mode
./tt echo
```

The CLI automatically connects to `http://localhost:8080` by default, or you can configure it with environment variables:

```bash
export TEENYTINY_URL=https://teenytiny.ai
export TEENYTINY_API_KEY=your-api-key
./tt echo "Hello from the cloud"
```

## Pay-per-request with MPP

TeenyTiny AI supports the [Machine Payments Protocol (MPP)](https://mpp.dev) as an alternative to API keys. When enabled, clients can pay per-request using [Tempo](https://tempo.xyz) stablecoins instead of needing an API key upfront.

API key authentication continues to work alongside MPP - existing integrations are unaffected.

### How it works

1. Client sends a request without an API key
2. Server responds `402 Payment Required` with a `WWW-Authenticate: Payment` challenge
3. Client pays (a fraction of a penny!) and retries with an `Authorization: Payment` credential
4. Server verifies payment and returns the response with a `Payment-Receipt` header

### Enable MPP on your server

Set these environment variables:

```bash
export MPP_PAY_TO=0xYourWalletAddress      # Your recipient wallet
export MPP_SECRET_KEY=your-secret-key       # Secret for challenge signing
export MPP_TESTNET=true                     # Use Tempo testnet (free!)
export MPP_PRICE=0.001                      # Price per request in USD (default: $0.001)

npm run dev
```

### Try it with purl

[purl](https://github.com/stripe/purl) is a curl-like CLI that handles MPP payments automatically.

```bash
# Install purl
brew install stripe/purl/purl

# Set up a wallet
purl wallet add
```

**Testnet** (free, for testing):

```bash
purl http://localhost:8080/v1/chat/completions \
  -X POST -H "Content-Type: application/json" \
  -d '{"model": "eliza", "messages": [{"role": "user", "content": "I feel curious about machine payments"}]}'
```

**Mainnet** (real money, fractions of a penny):

```bash
purl https://teenytiny.ai/v1/chat/completions \
  -X POST -H "Content-Type: application/json" \
  -d '{"model": "parry", "messages": [{"role": "user", "content": "Tell me about the conspiracy"}]}'
```

Use `purl --dry-run <url>` to preview the cost without paying, or `purl inspect <url>` to see payment requirements.

### Pricing

Default: **$0.001 per request** (one tenth of a cent). Configure with `MPP_PRICE`.

At this price, $1 buys you 1,000 API calls. It's meant to be fun and nearly free.

---

Built with love for the developer community. Questions? Open an issue on [GitHub](https://github.com/teenytinyai/teenytiny-api).
