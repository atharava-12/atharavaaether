import { useRef, useState, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Single-threaded core (no SharedArrayBuffer / COOP-COEP requirement) — works in Capacitor.
const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

export function useVideoEncoder() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loading, setLoading] = useState(false);
  const [encoding, setEncoding] = useState(false);
  const [progress, setProgress] = useState(0);

  const ensureLoaded = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    setLoading(true);
    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress: p }) => {
      setProgress(Math.max(0, Math.min(1, p)));
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    setLoading(false);
    return ffmpeg;
  }, []);

  const encodeFramesToMp4 = useCallback(
    async (frameUrls: string[], opts?: { sourceFps?: number; outputFps?: number }) => {
      const sourceFps = opts?.sourceFps ?? 6;
      const outputFps = opts?.outputFps ?? 24;

      const ffmpeg = await ensureLoaded();
      setEncoding(true);
      setProgress(0);

      try {
        // Write frames to virtual FS
        for (let i = 0; i < frameUrls.length; i++) {
          const data = await fetchFile(frameUrls[i]);
          const name = `frame_${String(i + 1).padStart(3, "0")}.png`;
          await ffmpeg.writeFile(name, data);
        }

        // Encode: scale to even dims, interpolate motion to smooth fps
        await ffmpeg.exec([
          "-framerate", String(sourceFps),
          "-i", "frame_%03d.png",
          "-vf", `scale=512:512:flags=lanczos,minterpolate=fps=${outputFps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`,
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-pix_fmt", "yuv420p",
          "-movflags", "+faststart",
          "output.mp4",
        ]);

        const data = await ffmpeg.readFile("output.mp4");
        const bytes = data as Uint8Array;
        // Copy into a fresh ArrayBuffer to satisfy BlobPart typing across TS lib versions
        const buf = new Uint8Array(bytes.byteLength);
        buf.set(bytes);
        const blob = new Blob([buf.buffer], { type: "video/mp4" });

        // Cleanup frames
        for (let i = 0; i < frameUrls.length; i++) {
          const name = `frame_${String(i + 1).padStart(3, "0")}.png`;
          try { await ffmpeg.deleteFile(name); } catch { /* ignore */ }
        }
        try { await ffmpeg.deleteFile("output.mp4"); } catch { /* ignore */ }

        return URL.createObjectURL(blob);
      } finally {
        setEncoding(false);
        setProgress(0);
      }
    },
    [ensureLoaded]
  );

  return { encodeFramesToMp4, loading, encoding, progress };
}
