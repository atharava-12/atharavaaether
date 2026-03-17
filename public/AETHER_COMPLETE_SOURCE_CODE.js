/*
=============================================================
  AETHER — Multimodal AI Command Center
  Complete Source Code Reference
  Generated: 2026-03-17
=============================================================
*/


// =============================================================
// FILE: src/index.css
// =============================================================
/*
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 47% 4%;
    --foreground: 210 40% 98%;
    --card: 222 30% 8%;
    --card-foreground: 210 40% 98%;
    --popover: 222 30% 8%;
    --popover-foreground: 210 40% 98%;
    --primary: 191 91% 50%;
    --primary-foreground: 222 47% 4%;
    --secondary: 217 19% 14%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 19% 27%;
    --muted-foreground: 215 20% 65%;
    --accent: 191 91% 50%;
    --accent-foreground: 222 47% 4%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 19% 20%;
    --input: 217 19% 16%;
    --ring: 191 91% 50%;
    --radius: 0.25rem;
    --sidebar-background: 222 30% 6%;
    --sidebar-foreground: 210 40% 85%;
    --sidebar-primary: 191 91% 50%;
    --sidebar-primary-foreground: 222 47% 4%;
    --sidebar-accent: 217 19% 14%;
    --sidebar-accent-foreground: 210 40% 98%;
    --sidebar-border: 217 19% 16%;
    --sidebar-ring: 191 91% 50%;
    --module-bg: 222 30% 7%;
    --module-border: 217 19% 14%;
    --input-bar-bg: 222 30% 8%;
    --glow-primary: 191 91% 50%;
    --surface-hover: 217 19% 12%;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'Inter', system-ui, sans-serif;
  }
  code, pre, .font-mono {
    font-family: 'JetBrains Mono', monospace;
  }
}

.noise-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 50; opacity: 0.03;
  background-image: url("data:image/svg+xml,...");
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: hsl(var(--muted)); border-radius: 3px; }

@keyframes breathe { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
.animate-breathe { animation: breathe 2s ease-in-out infinite; }

@keyframes progress-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
.animate-progress { animation: progress-slide 1.5s ease-in-out infinite; }

.prose-aether { @apply text-foreground leading-relaxed; }
.prose-aether p { @apply mb-3; }
.prose-aether code { @apply bg-secondary px-1.5 py-0.5 rounded text-[13px] font-mono; color: hsl(var(--primary)); }
.prose-aether pre { @apply bg-secondary p-4 rounded-lg overflow-x-auto mb-4; }
.prose-aether pre code { @apply bg-transparent p-0; }
.prose-aether ul, .prose-aether ol { @apply pl-5 mb-3; }
.prose-aether li { @apply mb-1; }
.prose-aether h1, .prose-aether h2, .prose-aether h3 { @apply font-semibold mb-2 mt-4; }
*/


// =============================================================
// FILE: tailwind.config.ts
// =============================================================
/*
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**\/*.{ts,tsx}", "./components/**\/*.{ts,tsx}", "./app/**\/*.{ts,tsx}", "./src/**\/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        module: { DEFAULT: "hsl(var(--module-bg))", border: "hsl(var(--module-border))" },
        "surface-hover": "hsl(var(--surface-hover))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
*/


// =============================================================
// FILE: src/main.tsx
// =============================================================

// import { createRoot } from "react-dom/client";
// import App from "./App.tsx";
// import "./index.css";
// createRoot(document.getElementById("root")!).render(<App />);


// =============================================================
// FILE: src/App.tsx
// =============================================================

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Route, Routes } from "react-router-dom";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import Index from "./pages/Index.tsx";
// import NotFound from "./pages/NotFound.tsx";
//
// const queryClient = new QueryClient();
//
// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <Routes>
//           <Route path="/" element={<Index />} />
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );
// export default App;


// =============================================================
// FILE: src/pages/Index.tsx
// =============================================================

// import { useRef, useEffect } from "react";
// import { Zap } from "lucide-react";
// import StatusBar from "@/components/StatusBar";
// import InputBar from "@/components/InputBar";
// import ResultModule from "@/components/ResultModule";
// import UserMessage from "@/components/UserMessage";
// import { useAether } from "@/hooks/useAether";
//
// const Index = () => {
//   const { messages, isLoading, latency, sendMessage } = useAether();
//   const scrollRef = useRef<HTMLDivElement>(null);
//
//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
//     }
//   }, [messages]);
//
//   return (
//     <div className="min-h-screen bg-background relative">
//       <div className="noise-overlay" />
//       <StatusBar isConnected={true} latency={latency} />
//       <div ref={scrollRef} className="pt-16 pb-32 px-[5vw] md:px-[10vw] max-w-4xl mx-auto overflow-y-auto h-screen">
//         {messages.length === 0 && (
//           <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
//             <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
//               <Zap size={20} className="text-primary" />
//             </div>
//             <h1 className="text-lg font-medium tracking-[-0.03em] text-foreground">Awaiting instruction...</h1>
//             <p className="text-sm text-muted-foreground text-center max-w-md font-mono">
//               Multilingual Q&A · Image synthesis · Cloud-connected
//             </p>
//             <div className="flex items-center gap-4 mt-6">
//               <span className="text-[11px] font-mono text-muted-foreground/50 tracking-wider">
//                 REGION: AUTO · MODELS: GEMINI · SYNC: ACTIVE
//               </span>
//             </div>
//           </div>
//         )}
//         <div className="flex flex-col gap-4">
//           {messages.map((msg) =>
//             msg.role === "user" ? (
//               <UserMessage key={msg.id} content={msg.content} mode={msg.mode} />
//             ) : (
//               <ResultModule
//                 key={msg.id}
//                 type={msg.type}
//                 label={msg.mode === "image" ? "IMAGE SYNTHESIS" : "RESPONSE"}
//                 meta={msg.meta}
//                 content={msg.content}
//                 imageUrl={msg.imageUrl}
//                 isStreaming={msg.isStreaming}
//               />
//             )
//           )}
//         </div>
//       </div>
//       <InputBar onSubmit={sendMessage} isLoading={isLoading} />
//     </div>
//   );
// };
// export default Index;


// =============================================================
// FILE: src/components/StatusBar.tsx
// =============================================================

// import { Cloud, Zap } from "lucide-react";
//
// interface StatusBarProps {
//   isConnected: boolean;
//   latency?: number;
// }
//
// const StatusBar = ({ isConnected, latency }: StatusBarProps) => {
//   return (
//     <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-md">
//       <div className="flex items-center gap-2">
//         <Zap size={14} className="text-primary" />
//         <span className="text-sm font-semibold tracking-[-0.03em]">AETHER</span>
//       </div>
//       <div className="flex items-center gap-4">
//         {latency && (
//           <span className="text-[11px] font-mono text-muted-foreground">LATENCY: {latency}ms</span>
//         )}
//         <div className="flex items-center gap-1.5">
//           <Cloud size={13} className={`${isConnected ? "text-primary animate-breathe" : "text-muted-foreground"}`} />
//           <span className="text-[11px] font-mono text-muted-foreground">
//             {isConnected ? "SYNC: ACTIVE" : "SYNC: IDLE"}
//           </span>
//         </div>
//       </div>
//     </header>
//   );
// };
// export default StatusBar;


// =============================================================
// FILE: src/components/InputBar.tsx
// =============================================================

// import { useState, useRef, useEffect } from "react";
// import { CornerDownLeft, Image as ImageIcon, MessageSquare } from "lucide-react";
//
// interface InputBarProps {
//   onSubmit: (message: string, mode: "chat" | "image") => void;
//   isLoading: boolean;
// }
//
// const InputBar = ({ onSubmit, isLoading }: InputBarProps) => {
//   const [input, setInput] = useState("");
//   const [mode, setMode] = useState<"chat" | "image">("chat");
//   const textareaRef = useRef<HTMLTextAreaElement>(null);
//
//   useEffect(() => {
//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//       textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
//     }
//   }, [input]);
//
//   const handleSubmit = () => {
//     if (!input.trim() || isLoading) return;
//     onSubmit(input.trim(), mode);
//     setInput("");
//   };
//
//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
//   };
//
//   return (
//     <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
//       <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
//         <div className="flex items-center gap-1 px-4 pt-3">
//           <button onClick={() => setMode("chat")}
//             className={`flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium tracking-wide transition-colors ${
//               mode === "chat" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
//             }`}>
//             <MessageSquare size={12} /> Q&A
//           </button>
//           <button onClick={() => setMode("image")}
//             className={`flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium tracking-wide transition-colors ${
//               mode === "image" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
//             }`}>
//             <ImageIcon size={12} /> IMAGE
//           </button>
//         </div>
//         <div className="flex items-end gap-3 px-4 pb-3 pt-2">
//           <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)}
//             onKeyDown={handleKeyDown}
//             placeholder={mode === "chat" ? "Ask anything in any language..." : "Describe the image you want to generate..."}
//             rows={1} disabled={isLoading}
//             className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none outline-none min-h-[36px] max-h-[120px] py-2 font-sans"
//           />
//           <button onClick={handleSubmit} disabled={!input.trim() || isLoading}
//             className="flex items-center justify-center h-8 w-8 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-1">
//             <CornerDownLeft size={14} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };
// export default InputBar;


// =============================================================
// FILE: src/components/ResultModule.tsx
// =============================================================

// import { motion } from "framer-motion";
// import ReactMarkdown from "react-markdown";
// import { Copy, Download, Check } from "lucide-react";
// import { useState } from "react";
//
// interface ResultModuleProps {
//   type: "text" | "image";
//   label: string;
//   meta?: string;
//   content: string;
//   imageUrl?: string;
//   isStreaming?: boolean;
// }
//
// const moduleVariant = {
//   initial: { opacity: 0, y: 20, scale: 0.98 },
//   animate: {
//     opacity: 1, y: 0, scale: 1,
//     transition: { type: "spring" as const, duration: 0.4, bounce: 0 },
//   },
// };
//
// const ResultModule = ({ type, label, meta, content, imageUrl, isStreaming }: ResultModuleProps) => {
//   const [copied, setCopied] = useState(false);
//
//   const handleCopy = () => {
//     navigator.clipboard.writeText(content);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };
//
//   const handleDownload = () => {
//     if (!imageUrl) return;
//     const a = document.createElement("a");
//     a.href = imageUrl;
//     a.download = "aether-generated.png";
//     a.click();
//   };
//
//   return (
//     <motion.section variants={moduleVariant} initial="initial" animate="animate"
//       className="w-full bg-card border border-border rounded-lg overflow-hidden">
//       {isStreaming && (
//         <div className="h-0.5 bg-secondary overflow-hidden">
//           <div className="h-full w-1/3 bg-primary animate-progress" />
//         </div>
//       )}
//       <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
//         <div className="flex items-center gap-3">
//           <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground">{label}</span>
//           {meta && <span className="text-[11px] font-mono text-muted-foreground/60">{meta}</span>}
//         </div>
//         <div className="flex items-center gap-1">
//           {type === "text" && (
//             <button onClick={handleCopy} className="h-7 px-2 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
//               {copied ? <Check size={13} /> : <Copy size={13} />}
//             </button>
//           )}
//           {type === "image" && imageUrl && (
//             <button onClick={handleDownload} className="h-7 px-2 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
//               <Download size={13} />
//             </button>
//           )}
//         </div>
//       </div>
//       <div className="px-4 py-4">
//         {type === "text" && (
//           <div className="prose-aether text-sm font-mono leading-relaxed">
//             <ReactMarkdown>{content}</ReactMarkdown>
//           </div>
//         )}
//         {type === "image" && imageUrl && (
//           <div className="aspect-video w-full overflow-hidden outline outline-1 outline-border">
//             <img src={imageUrl} alt={content} className="w-full h-full object-cover" />
//           </div>
//         )}
//         {type === "image" && !imageUrl && isStreaming && (
//           <div className="aspect-video w-full bg-secondary/30 flex items-center justify-center">
//             <span className="text-xs text-muted-foreground font-mono tracking-wider uppercase">Generating...</span>
//           </div>
//         )}
//       </div>
//     </motion.section>
//   );
// };
// export default ResultModule;


// =============================================================
// FILE: src/components/UserMessage.tsx
// =============================================================

// import { motion } from "framer-motion";
//
// interface UserMessageProps {
//   content: string;
//   mode: "chat" | "image";
// }
//
// const UserMessage = ({ content, mode }: UserMessageProps) => {
//   return (
//     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
//       className="w-full flex justify-end">
//       <div className="max-w-[80%] bg-secondary border border-border rounded-lg px-4 py-3">
//         <div className="flex items-center gap-2 mb-1">
//           <span className="text-[10px] font-mono tracking-[0.1em] uppercase text-muted-foreground">
//             {mode === "chat" ? "QUERY" : "IMAGE PROMPT"}
//           </span>
//         </div>
//         <p className="text-sm text-foreground">{content}</p>
//       </div>
//     </motion.div>
//   );
// };
// export default UserMessage;


// =============================================================
// FILE: src/hooks/useAether.ts
// =============================================================

// import { useState, useCallback, useRef } from "react";
// import { supabase } from "@/integrations/supabase/client";
//
// export interface AetherMessage {
//   id: string;
//   role: "user" | "assistant";
//   content: string;
//   type: "text" | "image";
//   mode: "chat" | "image";
//   imageUrl?: string;
//   isStreaming?: boolean;
//   meta?: string;
//   timestamp: number;
// }
//
// export function useAether() {
//   const [messages, setMessages] = useState<AetherMessage[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [latency, setLatency] = useState<number | undefined>();
//   const abortRef = useRef<AbortController | null>(null);
//
//   const sendMessage = useCallback(async (input: string, mode: "chat" | "image") => {
//     const userMsg: AetherMessage = {
//       id: crypto.randomUUID(), role: "user", content: input,
//       type: "text", mode, timestamp: Date.now(),
//     };
//     setMessages((prev) => [...prev, userMsg]);
//     setIsLoading(true);
//     const startTime = Date.now();
//
//     if (mode === "image") {
//       const assistantId = crypto.randomUUID();
//       setMessages((prev) => [...prev, {
//         id: assistantId, role: "assistant", content: input, type: "image",
//         mode: "image", isStreaming: true, meta: "MODEL: gemini-2.5-flash-image", timestamp: Date.now(),
//       }]);
//       try {
//         const { data, error } = await supabase.functions.invoke("aether-image", { body: { prompt: input } });
//         setLatency(Date.now() - startTime);
//         if (error) throw error;
//         setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, imageUrl: data.imageUrl, isStreaming: false } : m));
//       } catch (e) {
//         console.error("Image generation error:", e);
//         setMessages((prev) => prev.map((m) => m.id === assistantId
//           ? { ...m, type: "text" as const, content: "Image generation failed. Please try again.", isStreaming: false } : m));
//       }
//     } else {
//       const assistantId = crypto.randomUUID();
//       let fullContent = "";
//       setMessages((prev) => [...prev, {
//         id: assistantId, role: "assistant", content: "", type: "text",
//         mode: "chat", isStreaming: true, meta: "MODEL: gemini-3-flash-preview", timestamp: Date.now(),
//       }]);
//       try {
//         const conversationHistory = messages.filter((m) => m.mode === "chat")
//           .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
//         const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aether-chat`;
//         abortRef.current = new AbortController();
//         const resp = await fetch(CHAT_URL, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
//           },
//           body: JSON.stringify({ messages: [...conversationHistory, { role: "user", content: input }] }),
//           signal: abortRef.current.signal,
//         });
//         if (!resp.ok || !resp.body) {
//           const errData = await resp.json().catch(() => ({}));
//           throw new Error(errData.error || "Stream failed");
//         }
//         const reader = resp.body.getReader();
//         const decoder = new TextDecoder();
//         let textBuffer = "";
//         let streamDone = false;
//         while (!streamDone) {
//           const { done, value } = await reader.read();
//           if (done) break;
//           textBuffer += decoder.decode(value, { stream: true });
//           let newlineIndex: number;
//           while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
//             let line = textBuffer.slice(0, newlineIndex);
//             textBuffer = textBuffer.slice(newlineIndex + 1);
//             if (line.endsWith("\r")) line = line.slice(0, -1);
//             if (line.startsWith(":") || line.trim() === "") continue;
//             if (!line.startsWith("data: ")) continue;
//             const jsonStr = line.slice(6).trim();
//             if (jsonStr === "[DONE]") { streamDone = true; break; }
//             try {
//               const parsed = JSON.parse(jsonStr);
//               const content = parsed.choices?.[0]?.delta?.content as string | undefined;
//               if (content) {
//                 fullContent += content;
//                 setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: fullContent } : m));
//               }
//             } catch { textBuffer = line + "\n" + textBuffer; break; }
//           }
//         }
//         setLatency(Date.now() - startTime);
//         setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m));
//       } catch (e: unknown) {
//         console.error("Chat error:", e);
//         if (e instanceof Error && e.name === "AbortError") return;
//         setMessages((prev) => prev.map((m) => m.id === assistantId
//           ? { ...m, content: "An error occurred. Please try again.", isStreaming: false } : m));
//       }
//     }
//     setIsLoading(false);
//   }, [messages]);
//
//   return { messages, isLoading, latency, sendMessage };
// }


// =============================================================
// FILE: supabase/functions/aether-chat/index.ts (Edge Function)
// =============================================================

// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
//
// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
// };
//
// serve(async (req) => {
//   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
//   try {
//     const { messages } = await req.json();
//     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
//     if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
//     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
//       method: "POST",
//       headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
//       body: JSON.stringify({
//         model: "google/gemini-3-flash-preview",
//         messages: [
//           { role: "system", content: "You are Aether, a multilingual AI assistant. You answer questions in any language the user writes in. Be precise, clear, and helpful. Use markdown formatting for structured responses. If the user writes in a specific language, respond in that same language." },
//           ...messages,
//         ],
//         stream: true,
//       }),
//     });
//     if (!response.ok) {
//       if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
//       if (response.status === 402) return new Response(JSON.stringify({ error: "Usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
//       const t = await response.text();
//       console.error("AI gateway error:", response.status, t);
//       return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
//     }
//     return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
//   } catch (e) {
//     console.error("chat error:", e);
//     return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
//   }
// });


// =============================================================
// FILE: supabase/functions/aether-image/index.ts (Edge Function)
// =============================================================

// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
//
// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
// };
//
// serve(async (req) => {
//   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
//   try {
//     const { prompt } = await req.json();
//     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
//     if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
//     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
//       method: "POST",
//       headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
//       body: JSON.stringify({
//         model: "google/gemini-2.5-flash-image",
//         messages: [{ role: "user", content: prompt }],
//         modalities: ["image", "text"],
//       }),
//     });
//     if (!response.ok) {
//       if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
//       if (response.status === 402) return new Response(JSON.stringify({ error: "Usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
//       const t = await response.text();
//       console.error("Image generation error:", response.status, t);
//       return new Response(JSON.stringify({ error: "Image generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
//     }
//     const data = await response.json();
//     const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
//     const text = data.choices?.[0]?.message?.content || "";
//     if (!imageUrl) return new Response(JSON.stringify({ error: "No image was generated", text }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
//     return new Response(JSON.stringify({ imageUrl, text }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
//   } catch (e) {
//     console.error("Image error:", e);
//     return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
//   }
// });


// =============================================================
// FILE: supabase/config.toml
// =============================================================

// project_id = "uqtwfooizzkleyvozaeu"
//
// [functions.aether-chat]
// verify_jwt = false
//
// [functions.aether-image]
// verify_jwt = false


// =============================================================
// END OF COMPLETE SOURCE CODE REFERENCE
// =============================================================
