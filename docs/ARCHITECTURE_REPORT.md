# ChitChatGen Architecture Report

## 1. Current architecture snapshot

The application is a Vite + React + TypeScript frontend with shadcn/ui styling and Tailwind, backed by Supabase for authentication and data persistence. The project has a strong chat-first architecture with a fallback guest/localStorage mode for unauthenticated sessions.

### Frontend stack
- React 18 + Vite + TypeScript
- React Router for protected routes and onboarding flow
- TanStack Query for app-level data orchestration
- Tailwind + shadcn/ui for UI primitives
- Framer Motion and Lucide icons for polished UI feedback

### Backend and data layer
- Supabase project with Postgres tables for `profiles`, `conversations`, `messages`, and related features
- Supabase auth for email/OAuth session management
- Edge function integrations for chat and image generation (`aether-chat`, `aether-image`, `elevenlabs-tts`)
- LocalStorage-based guest chat backup and migration path into authenticated user data

### Core flow
- `src/App.tsx` sets route guards for auth and onboarding.
- `src/hooks/useAuth.ts` handles session lifecycle and OAuth login.
- `src/hooks/useChatStorage.ts` saves/loading chat history per conversation with local fallback.
- `src/hooks/useAether.ts` owns streaming chat and image generation logic.
- `src/pages/Index.tsx` composes the chat interface around the hook and storage layer.

## 2. Existing strengths

- Strong route protection and onboarding flow
- Real data persistence with migration safeguards for guest users
- Streaming chat support via SSE-like parsing in `src/lib/chatStream.ts`
- Open-source model registry in `src/lib/models.ts`
- Secure provider config pattern for Supabase clients and environment-driven configuration

## 3. Implementation gaps against the 20-phase roadmap

The repository is already a viable Vite + Supabase chat app, but it still reflects a product-maturity gap compared to the full AI super-app roadmap:

- Model routing is not centralized; selection is mostly manual in the UI.
- No provider adapter abstraction beyond direct function invocation.
- No structured admin model registry or policy metadata for provider fallbacks.
- No full research/file/voice/agents/workspace architecture yet.
- Documentation is minimal and the app does not yet expose a staged roadmap to contributors.

## 4. Safe upgrade strategy

To stay consistent with the goal of upgrading rather than rewriting, the recommended path is incremental architecture enhancement:

1. Centralize model routing and provider metadata.
2. Keep the current Supabase auth/chat architecture intact.
3. Add router and provider abstractions without breaking the existing frontend flow.
4. Document external requirements and deployment blockers.
5. Add tests around model routing and stream parsing before adding larger features.

## 5. Recommended next stages

- Stage 1: Architecture and planning (complete in this work)
- Stage 2: Premium chat experience and model intelligence
- Stage 3: AI gateway, model integrations, and smart routing
- Stage 4: Research, document intelligence, and file workflows
- Stage 5: Voice, image, and code assistant features
- Stage 6+: Agents, workspaces, memory, billing, and admin dashboards

## 6. External requirements

The app expects real environment configuration for production use:
- Supabase URL and anon/public key
- Chat and image Edge function access
- Optional AI provider secrets on the server side
- Browser microphone permission only when voice features are enabled

The codebase handles missing config gracefully through no-op clients and explicit error messages rather than silently failing.
