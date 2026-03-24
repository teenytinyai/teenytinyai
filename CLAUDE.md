# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TeenyTiny AI - An OpenAI-compatible chat completions API built with TypeScript for Cloudflare Workers and Node.js. Provides a lightweight, edge-deployable alternative to OpenAI's API with full streaming support and authentication.

## Development Commands

Common development tasks:
- **Dev server**: `npm run dev` (starts on port 8080 with hot reload)
- **Build**: `npm run build` (compiles TypeScript to dist/)
- **Test**: `npm test` (Vitest in watch mode)
- **Test CI**: `npm run test:ci` (single test run)
- **Production**: `npm start` (runs built server)
- **CF Deploy**: `npm run deploy` (deploy to Cloudflare Workers)
- **CF Dev**: `npm run cf:dev` (local Cloudflare Workers dev environment)

## Architecture & Structure

**Runtime Agnostic Design**: The codebase is designed to run on multiple runtimes:
- **Cloudflare Workers** (primary target) - Edge computing with global distribution
- **Node.js** (development/self-hosting) - Traditional server deployment
- **Future runtimes** - Structured for easy adaptation to Deno, Bun, AWS Lambda, etc.

**Key Components**:
- **Hono Framework**: Web framework that works across runtimes (CF Workers, Node.js, Bun, etc.)
- **Model System**: Pluggable model architecture with base interface for easy extension
- **Middleware Stack**: Auth, CORS, logging, error handling - all runtime agnostic
- **TypeScript**: Full type safety with strict mode enabled
- **Streaming**: SSE-based streaming that works in both CF Workers and Node.js

**Directory Structure**:
```
src/
├── types/           # OpenAI-compatible type definitions
├── models/          # Model implementations (Echo model + base interface)
├── middleware/      # HTTP middleware (auth, CORS, logging, errors)
├── app.ts          # Main Hono application (runtime agnostic)
├── server.ts       # Node.js entry point with CLI args
└── index.ts        # Cloudflare Worker entry point
```

## Development Patterns

**Runtime Compatibility**:
- Use `globalThis.crypto` with fallbacks for Node.js compatibility
- Hono provides runtime-agnostic Request/Response handling
- Environment-specific code goes in entry points (server.ts vs index.ts)
- Middleware and core logic stays runtime-neutral

**Error Handling**:
- Custom `APIError` classes that extend Error with OpenAI-compatible response format
- Centralized error handler middleware converts all errors to proper JSON responses
- Type-safe error construction with proper status codes

**Model Architecture**:
- `ChatModel` interface defines contract for all models
- `ModelRegistry` manages available models with type safety
- Models implement both streaming and non-streaming completions
- Token estimation utilities for usage tracking

**Testing Strategy**:
- Integration tests using Vitest that test the full HTTP stack
- Tests use Hono's built-in `app.request()` method for realistic testing
- Runtime-agnostic tests work with any deployment target
- Comprehensive API compatibility testing

## General Development Rules

* Before each commit, reflect on the lessons we've learned together and update this CLAUDE.md for future use. Focus on generic patterns and techniques, not specifics of a single feature.

* Test first! Before adding functionality or fixing anything, write a test that can reproduce the failing state first. Prefer to build high level integration tests that actually surface the issue in a realistic environment. Be confident it works before stopping.

* Keep README.md up to date. It should contain, in order:
  - A one line description
  - Intro paragraph including: what this is, who its for and how it can help you, why it may be chosen over alternatives, and how to use it.
  - "10 second tutorial", enough for someone to glance at, see an example of how to use it and the result, and form a quick understanding of what this does concretely.
  - Features (most relevant, as a list)
  - User guide
  - Developer guide (only for those who want to change the project itself)

## Project Specific Rules

**OpenAI API Compatibility**: Always maintain strict compatibility with OpenAI's chat completions API:
- Exact JSON request/response format matching
- Proper error response structure with `error.type` and `error.message`
- Streaming format using SSE with `data:` prefix and `[DONE]` terminator
- Token usage reporting in responses
- Standard HTTP status codes (400, 401, 404, 500)

**Runtime Agnostic Code**: Structure code to work across multiple runtimes:
- Use Hono for HTTP handling (works everywhere)
- Avoid runtime-specific APIs in core logic
- Use polyfills/fallbacks for missing globals (like crypto)
- Keep environment-specific code in entry points only

**Model Development**: When adding new models:
- Implement the `ChatModel` interface
- Support both streaming and non-streaming responses
- Include proper token counting for usage tracking
- Register models in the `ModelRegistry`
- Add comprehensive tests for the new model

**TypeScript Strictness**: Maintain strict TypeScript configuration:
- `exactOptionalPropertyTypes: true` - handle optional props correctly
- `noUncheckedIndexedAccess: true` - safe array/object access
- Proper type guards for runtime validation
- Explicit undefined handling for optional fields

**Authentication & Security**: 
- Bearer token authentication required for all API endpoints (except /health)
- Environment-based API key configuration
- No hardcoded secrets in code
- Proper CORS handling for browser requests

**MPP (Machine Payments Protocol)**:
- MPP is configured via environment variables (MPP_PAY_TO, MPP_SECRET_KEY, etc.) and wired through AuthConfig
- The mppx SDK is used for Hono middleware integration — lazy-initialized to avoid startup cost when MPP is disabled
- Auth middleware pattern: check Bearer token first, fall through to MPP payment if no valid Bearer
- When adding new auth methods, use the same fallback pattern — valid Bearer always takes priority
- The 402 challenge flow is stateless (HMAC-bound challenge IDs) — no database needed for payment verification

- Git commit messages should describe the final state of the commit, not all the steps we took along the way