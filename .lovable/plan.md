# Automatic NVIDIA Fallback on 402

When the Lovable AI gateway returns a 402 "usage limit reached" error, the edge function automatically retries the same request on NVIDIA Flux 2 Klein. The UI notifies the user that a fallback occurred and which model produced the image.

## Backend changes — `supabase/functions/aether-image/index.ts`

1. In the `lovable` provider branch, wrap `callLovableImage` in try/catch.
2. If the error status is `402` (or message matches `/usage limit|402/i`) AND `NVIDIA_API_KEY` is configured, automatically call `callNvidiaFlux` with the same prompt and image.
3. On successful fallback, return:
  ```
   { imageUrl, fallback: true, fallbackModel: "NVIDIA Flux 2 Klein",
     fallbackReason: "Lovable AI usage limit reached" }
  ```
4. If NVIDIA also fails, return the original 402 error.
5. Other errors (429, safety blocks) are NOT auto-retried.
6. Log fallback events with `console.log` for edge function logs.

## Frontend changes — `src/pages/ImageGen.tsx`

1. Read `data.fallback` and `data.fallbackModel` from the response.
2. When `fallback === true`:
  - Show `toast.info("Switched to NVIDIA Flux", { description: "Lovable AI credits exhausted — used NVIDIA Flux 2 Klein instead" })`.
  - Save the image with `meta: "MODEL: NVIDIA Flux 2 Klein (fallback from <originalModel>)"`.
  - Add a small "FALLBACK" badge on the image card next to the prompt.
3. Extend `GeneratedImage` with `fallback?: boolean` and `fallbackModel?: string` so the badge persists during the session.

## Notes

- Fallback only triggers for Lovable AI models (Nano Banana family). NVIDIA / HF providers are unaffected.
- NVIDIA Flux supports both text-to-image and image editing — fallback works for both modes.
- No new secrets needed; `NVIDIA_API_KEY` is already configured.

## Files changed

- `supabase/functions/aether-image/index.ts`
- `src/pages/ImageGen.tsx                                                           in the message it should say nano banana is not working right now please try again .Using nvidia 2 for image generation`