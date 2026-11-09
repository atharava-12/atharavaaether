# ChitChatGen

ChitChatGen is a Vite + React + TypeScript AI chat application built with Supabase and a shadcn/ui design system. The repository already includes authenticated chat, onboarding, guest-mode fallback, chat storage, and model selection.

## Architecture overview

See [docs/ARCHITECTURE_REPORT.md](docs/ARCHITECTURE_REPORT.md) for the full architecture snapshot and upgrade strategy.

## Core stack
- Frontend: React, TypeScript, Vite, Tailwind, shadcn/ui
- Auth and data: Supabase Auth + Postgres
- Streaming AI: Edge function requests with SSE parsing in `src/lib/chatStream.ts`
- Model registry: `src/lib/models.ts`
- App state: `src/hooks/useAether.ts`, `src/hooks/useChatStorage.ts`, `src/hooks/useAuth.ts`

## Safe implementation approach

The project is being upgraded incrementally instead of being rewritten. The focus is on preserving current users, conversations, and auth flows while introducing a centralized model-router layer and clearer provider metadata.

## Required environment configuration

The app expects the following browser-side values in `.env` or `.env.local`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`

For live research and document intelligence, configure these server-side values before enabling the feature:

- `HF_TOKEN`
- `NVIDIA_API_KEY`
- `VITE_BRAVE_SEARCH_API_KEY`
- `VITE_SERPAPI_KEY`
- `VITE_GOOGLE_SEARCH_API_KEY`

Production AI provider secrets should be configured on the server side, not embedded in frontend code.

## Validation

Run the application test suite with:

```bash
npm test
```

The project also includes a model-router test suite in `src/lib/aiGateway.test.ts`.
