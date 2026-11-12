import os
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

import httpx
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_PUBLISHABLE_KEY = os.environ["SUPABASE_PUBLISHABLE_KEY"]
AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama").lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:4b")
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1").rstrip("/")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
CLOUD_AI_BASE_URL = os.getenv("CLOUD_AI_BASE_URL", "").rstrip("/")
CLOUD_AI_API_KEY = os.getenv("CLOUD_AI_API_KEY", "")
CLOUD_AI_MODEL = os.getenv("CLOUD_AI_MODEL", "")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,https://chitchatgen.com,https://www.chitchatgen.com",
    ).split(",")
    if origin.strip()
]

NVIDIA_MODEL_IDS = {
    "nemotron-nano": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    "qwen-3.5": "qwen/qwen3.5-397b-a17b",
    "nemotron-super": "nvidia/nemotron-3-super-120b-a12b",
    "mistral-large": "mistralai/mistral-large-3-675b-instruct-2512",
    "mistral-small": "mistralai/mistral-small-4-119b-2603",
    "gemma-3n": "google/gemma-3n-e4b-it",
}
http_client: httpx.AsyncClient
bearer = HTTPBearer(auto_error=False)


@asynccontextmanager
async def lifespan(_: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(timeout=httpx.Timeout(300.0, connect=10.0))
    yield
    await http_client.aclose()


app = FastAPI(title="ChitChatGen AI API", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "apikey"],
)


class ChatCompletionRequest(BaseModel):
    # modelId keeps compatibility with the existing ChitChatGen chat hook.
    model: str | None = None
    modelId: str | None = None
    messages: list[dict[str, Any]] = Field(min_length=1)
    stream: bool = True
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_tokens: int | None = Field(default=None, ge=1, le=32768)


async def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer access token required")

    # Supabase Auth validates the user token. The publishable key is public;
    # inference-provider keys remain on the server.
    response = await http_client.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "apikey": SUPABASE_PUBLISHABLE_KEY,
            "Authorization": f"Bearer {credentials.credentials}",
        },
    )
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    return response.json()


def provider_target(requested_model: str) -> tuple[str, str, str | None]:
    if AI_PROVIDER == "ollama":
        allowed_models = {"chitchat-local", *NVIDIA_MODEL_IDS.keys()}
        if requested_model not in allowed_models:
            raise HTTPException(status_code=400, detail="Unsupported model ID")
        return f"{OLLAMA_BASE_URL}/chat/completions", OLLAMA_MODEL, None

    if AI_PROVIDER == "nvidia":
        if not NVIDIA_API_KEY:
            raise HTTPException(status_code=503, detail="Cloud inference is not configured")
        if requested_model == "chitchat-local":
            model_id = "nemotron-super"
        elif requested_model in NVIDIA_MODEL_IDS:
            model_id = requested_model
        else:
            raise HTTPException(status_code=400, detail="Unsupported model ID")
        return (
            f"{NVIDIA_BASE_URL}/chat/completions",
            NVIDIA_MODEL_IDS[model_id],
            NVIDIA_API_KEY,
        )

    if AI_PROVIDER == "openai-compatible":
        if not CLOUD_AI_BASE_URL or not CLOUD_AI_API_KEY or not CLOUD_AI_MODEL:
            raise HTTPException(status_code=503, detail="Cloud inference is not configured")
        if requested_model not in {"chitchat-cloud", "chitchat-local", *NVIDIA_MODEL_IDS.keys()}:
            raise HTTPException(status_code=400, detail="Unsupported model ID")
        return (
            f"{CLOUD_AI_BASE_URL}/chat/completions",
            CLOUD_AI_MODEL,
            CLOUD_AI_API_KEY,
        )

    raise HTTPException(status_code=500, detail="AI_PROVIDER must be ollama, nvidia, or openai-compatible")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/models")
async def list_models(_: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if AI_PROVIDER == "nvidia":
        ids = list(NVIDIA_MODEL_IDS)
    elif AI_PROVIDER == "openai-compatible":
        ids = ["chitchat-cloud"]
    else:
        ids = ["chitchat-local"]
    return {
        "object": "list",
        "data": [{"id": model_id, "object": "model", "owned_by": "chitchatgen"} for model_id in ids],
    }


@app.post("/v1/chat/completions")
async def chat_completions(
    body: ChatCompletionRequest,
    _: dict[str, Any] = Depends(current_user),
) -> StreamingResponse:
    if not body.stream:
        raise HTTPException(status_code=400, detail="This endpoint currently requires stream=true")

    requested_model = body.modelId or body.model or "chitchat-local"
    url, upstream_model, api_key = provider_target(requested_model)
    payload: dict[str, Any] = {
        "model": upstream_model,
        "messages": body.messages,
        "stream": True,
    }
    if body.temperature is not None:
        payload["temperature"] = body.temperature
    if body.max_tokens is not None:
        payload["max_tokens"] = body.max_tokens

    headers = {"Accept": "text/event-stream"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    request = http_client.build_request("POST", url, json=payload, headers=headers)
    try:
        upstream = await http_client.send(request, stream=True)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not connect to the configured model service") from exc

    if upstream.status_code >= 400:
        status = upstream.status_code
        await upstream.aclose()
        if status == 429:
            raise HTTPException(status_code=429, detail="Model provider rate limit reached")
        raise HTTPException(status_code=502, detail=f"Model provider returned status {status}")

    async def stream_body() -> AsyncIterator[bytes]:
        try:
            async for chunk in upstream.aiter_bytes():
                yield chunk
        finally:
            await upstream.aclose()

    return StreamingResponse(
        stream_body(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
