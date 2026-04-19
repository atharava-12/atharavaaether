

User wants real MP4 video output, not animated frame sequences. Currently `aether-video` returns image frames played at 4fps client-side.

**Approach**: Use ffmpeg.wasm in the browser to encode the generated frames into a downloadable MP4. Lovable AI Gateway has no native video model, so frame-generation remains the source — but we'll composite into a real video file.

## Plan

### 1. Add ffmpeg.wasm
Install `@ffmpeg/ffmpeg` and `@ffmpeg/util` for in-browser MP4 encoding (no backend needed, no API key).

### 2. Increase frame quality
Update `aether-video` edge function: bump default `frameCount` from 6 to 12, and add motion-interpolation prompts so frames flow smoothly (e.g. "subtle camera pan", "frame N of N showing progressive motion").

### 3. Build video encoder hook
New `src/hooks/useVideoEncoder.ts`:
- Loads ffmpeg.wasm (lazy, with progress)
- Takes frame URLs, fetches each as blob
- Writes frames to ffmpeg FS as `frame_001.png`...
- Runs: `ffmpeg -framerate 8 -i frame_%03d.png -vf "scale=512:512,minterpolate=fps=24" -c:v libx264 -pix_fmt yuv420p -movflags +faststart output.mp4`
- `minterpolate` filter generates intermediate frames → smooth 24fps from 8fps source
- Returns MP4 Blob URL

### 4. Rewrite VideoGen page
- Replace `FrameAnimator` with HTML5 `<video>` element with native controls
- After frames return from edge function, encode → display real `.mp4`
- Add download button (saves real .mp4 file)
- Show two-stage progress: "Generating frames..." then "Encoding video..."

### 5. Vite config
Add COOP/COEP headers in `vite.config.ts` for SharedArrayBuffer (required by ffmpeg.wasm multi-threaded build), or use single-threaded ffmpeg.wasm core to avoid that requirement. Will use single-threaded core for compatibility with Capacitor/mobile.

## Files
- **Modify**: `supabase/functions/aether-video/index.ts`, `src/pages/VideoGen.tsx`, `package.json`
- **Create**: `src/hooks/useVideoEncoder.ts`

## Tradeoffs
- ffmpeg.wasm core ~25MB, lazy-loaded only when user generates a video
- Encoding takes 5-15s on mobile after frame generation
- Result is a real, shareable, downloadable .mp4 — works in any video player

