# ChitChatGen AI API

This FastAPI service is designed for two modes:

- **Local development:** Ollama runs on the developer's computer.
- **Public service:** FastAPI is deployed on Vercel and calls cloud inference. Users reach it from any device through the public API URL; their devices do not need Ollama or a local model.

The existing Vite frontend remains its own Vercel project. Deploy this folder as a separate Vercel project with **Root Directory** set to `backend`. That keeps the existing static-site configuration separate from the Python API.

## Local development

1. Install Ollama and download the starter model:

   ```sh
   ollama pull qwen3.5:4b
   ```

2. In the backend terminal:

   ```sh
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   ```

3. Fill `.env` with the Supabase project URL and publishable key. Leave `AI_PROVIDER=ollama` and `OLLAMA_MODEL=qwen3.5:4b`.
4. Start the API:

   ```sh
   uvicorn app:app --reload
   ```

The local API listens at `http://127.0.0.1:8000`. Its health endpoint is `/health`; chat is `POST /v1/chat/completions`. Chat requests require a valid Supabase user access token.

## Public deployment

Create a **separate Vercel project** connected to this repository and set its Root Directory to `backend`. Configure these environment variables in that project's settings:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `AI_PROVIDER=nvidia`
- `NVIDIA_API_KEY` (server-side secret)
- `ALLOWED_ORIGINS=https://chitchatgen.com,https://www.chitchatgen.com`

Deploy the backend project to get a public API URL, then optionally attach `api.chitchatgen.com`. The frontend must be configured to call that URL in a later integration step. Do not expose a provider key in Vite variables or browser code.

NVIDIA's API Catalog offers NIM endpoint access to Developer Program members for prototyping; availability and limits can change. The local Ollama mode is not used by this public deployment.


## Connect the existing frontend

After the backend has deployed, set `VITE_AI_API_BASE_URL` in the existing frontend Vercel project's environment variables to the backend URL (for example, `https://your-api.vercel.app`) and redeploy the frontend. Signed-in chat requests will then use FastAPI with the user's Supabase access token. Signed-out guest chat keeps using the existing Supabase Edge Function for now, so the current guest experience continues during this first migration step.

## Current scope

This first public-capable slice handles authenticated, streaming text chat. It does not yet persist chats through the API or implement image uploads, vision, image generation, voice, research, or math routes. Those remain follow-up steps. Do not expose Ollama on the public internet.
