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
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:4b")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
http_client: httpx.AsyncClient
bearer = HTTPBearer(auto_error=False)


@asynccontextmanager
async def lifespan(_: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(timeout=httpx.Timeout(300.0, connect=10.0))
    yield
    await http_client.aclose()


app = FastAPI(title="ChitChatGen AI API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


class ChatCompletionRequest(BaseModel):
    model: str = "chitchat-local"
    messages: list[dict[str, Any]] = Field(min_length=1)
    stream: bool = True
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_tokens: int | None = Field(default=None, ge=1, le=32768)


async def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer access token required")

    # Let Supabase Auth validate the user's access token. The publishable key is
    # public by design; provider credentials are never sent to this endpoint.
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


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/models")
async def list_models(_: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    return {
        "object": "list",
        "data": [
            {
                "id": "chitchat-local",
                "object": "model",
                "owned_by": "chitchatgen",
            }
        ],
    }


@app.post("/v1/chat/completions")
async def chat_completions(
    body: ChatCompletionRequest,
    _: dict[str, Any] = Depends(current_user),
) -> StreamingResponse:
    if body.model != "chitchat-local":
        raise HTTPException(status_code=400, detail="Unsupported model ID")
    if not body.stream:
        raise HTTPException(status_code=400, detail="This endpoint currently requires stream=true")

    payload: dict[str, Any] = {
        "model": OLLAMA_MODEL,
        "messages": body.messages,
        "stream": True,
    }
    if body.temperature is not None:
        payload["temperature"] = body.temperature
    if body.max_tokens is not None:
        payload["max_tokens"] = body.max_tokens

    request = http_client.build_request(
        "POST",
        f"{OLLAMA_BASE_URL}/chat/completions",
        json=payload,
        headers={"Accept": "text/event-stream"},
    )
    try:
        upstream = await http_client.send(request, stream=True)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not connect to the configured model service") from exc

    if upstream.status_code >= 400:
        error_body = (await upstream.aread()).decode("utf-8", errors="replace")
        await upstream.aclose()
        raise HTTPException(status_code=502, detail=f"Model service returned {upstream.status_code}: {error_body[:500]}")

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
