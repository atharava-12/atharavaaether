# ChitChatGen AI API (first slice)

This is the first backend step: a FastAPI gateway that checks a Supabase access token and streams chat completions from a locally running Ollama instance. The existing Vite frontend and Supabase database are not changed by this service.

## Local setup

1. Install Ollama and make sure your laptop can run a model that fits its memory.
2. In one terminal, download a model supported by your Ollama installation and start Ollama. For the default below:

   ```sh
   ollama pull qwen3.5
   ollama serve
   ```

3. In a second terminal:

   ```sh
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   ```

4. Fill `.env` with the project URL and publishable key from Supabase. Keep real values out of Git.
5. Start the API:

   ```sh
   uvicorn app:app --reload
   ```

The API is at `http://127.0.0.1:8000`; health is `/health`. Chat routes require a real Supabase user access token:

- `GET /v1/models`
- `POST /v1/chat/completions` (OpenAI-compatible SSE stream; requires `stream: true`)

The only enabled public model ID is `chitchat-local`. It maps server-side to `OLLAMA_MODEL`; clients cannot select a provider URL or pass a provider secret.

## Current limits

This is an initial development gateway. It does not yet save messages, support uploads, or expose vision, image, voice, research, or math routes. The current browser chat hook is not connected to it yet. Do not expose the laptop's Ollama port or this development API directly to the public internet. Production deployment, user-level rate limits, database persistence, and frontend integration are later steps.
