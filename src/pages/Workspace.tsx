import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Code2, Copy, ListFilter, Mic, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import AgentExecutionPanel from "@/components/AgentExecutionPanel";
import AgentWorkflowPanel from "@/components/AgentWorkflowPanel";
import BottomNav from "@/components/BottomNav";
import DocumentIntelligence from "@/components/DocumentIntelligence";
import HealthMetricsPanel from "@/components/HealthMetricsPanel";
import ProjectPlanPanel from "@/components/ProjectPlanPanel";
import ReleaseChecklistPanel from "@/components/ReleaseChecklistPanel";
import SeoHead from "@/components/SeoHead";
import {
  WORKSPACE_TEMPLATES,
  buildCodeSuggestion,
  getVoiceSupportStatus,
  summarizeCode,
  type WorkspaceLanguage,
} from "@/lib/workspace";

const Workspace = () => {
  const [language, setLanguage] = useState<WorkspaceLanguage>("typescript");
  const [code, setCode] = useState(WORKSPACE_TEMPLATES.typescript.starter);
  const [task, setTask] = useState("");
  const [summary, setSummary] = useState("Choose a language and describe what you need.");
  const [voiceStatus, setVoiceStatus] = useState<"supported" | "unsupported">("unsupported");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setVoiceStatus(getVoiceSupportStatus());
  }, []);

  useEffect(() => {
    setCode(WORKSPACE_TEMPLATES[language].starter);
    setSummary(`${WORKSPACE_TEMPLATES[language].label} selected. Describe a task to create a starter from the workspace templates.`);
  }, [language]);

  const templateOptions = useMemo(() => Object.values(WORKSPACE_TEMPLATES), []);

  const handleGenerate = () => {
    const generated = buildCodeSuggestion(language, task);
    setCode(generated);
    setSummary(summarizeCode(generated, language));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard");
    } catch {
      toast.error("Clipboard access is unavailable in this browser");
    }
  };

  const handleVoiceToggle = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!Recognition) {
      setSummary("Voice capture is not available in this browser. Use text input instead.");
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      setSummary("Voice capture stopped.");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript ?? "")
        .join(" ");
      if (transcript.trim()) {
        setTask(transcript.trim());
        setSummary(`Captured prompt: ${transcript.trim()}`);
      }
    };
    recognition.onerror = () => {
      setListening(false);
      setSummary("Voice input failed. Please try again with text input.");
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
    setSummary("Listening for a code prompt...");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="AI Workspace – ChitChat AI"
        description="A coding and voice workspace for generating, reviewing, and iterating on code blocks."
        path="/workspace"
      />

      <header className="h-14 border-b border-border flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-primary" />
          <span className="text-sm font-semibold tracking-[-0.02em]">AI Workspace</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="rounded-full border border-border px-2 py-1">
            {voiceStatus === "supported" ? "Voice input available" : "Voice input unavailable"}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-32 sm:px-6">
        <div className="mb-6 max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">What would you like to build?</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Describe a coding task, choose a language, and create a starter you can edit and copy.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(290px,0.4fr)_minmax(0,0.6fr)]">
          <aside className="contents">
            <section className="order-1 rounded-xl border border-border bg-card p-4 lg:col-start-1 lg:row-start-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Wand2 size={15} className="text-primary" />
                Describe your task
              </div>

              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="workspace-language" className="text-sm font-medium text-foreground">Programming language</label>
                <select
                  id="workspace-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as WorkspaceLanguage)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                >
                  {templateOptions.map((template) => (
                    <option key={template.language} value={template.language}>
                      {template.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{WORKSPACE_TEMPLATES[language].description}</p>
                </div>

                <div className="space-y-1.5">
                <label htmlFor="workspace-task" className="text-sm font-medium text-foreground">What should the code do?</label>
                <textarea
                  id="workspace-task"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  rows={5}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground"
                  placeholder="For example: Create a function that waits until typing stops before searching"
                />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={!task.trim()}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Sparkles size={14} />
                    Create code starter
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background transition hover:bg-secondary"
                    aria-label="Copy code"
                    title="Copy code"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                <button
                  onClick={handleVoiceToggle}
                  className={`w-full h-10 rounded-lg border text-sm font-medium transition ${
                    listening ? "border-rose-500 bg-rose-500/10 text-rose-500" : "border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {listening ? <Mic size={14} className="animate-pulse" /> : <Mic size={14} />}
                    {listening ? "Stop listening" : "Use voice input"}
                  </span>
                </button>
              </div>
            </section>

            <section className="order-3 lg:col-start-1 lg:row-start-2" aria-labelledby="workspace-tools-heading">
              <h2 id="workspace-tools-heading" className="mb-1 text-sm font-semibold text-foreground">More tools</h2>
              <p className="mb-2 text-xs text-muted-foreground">Optional helpers for your task.</p>
              <div className="divide-y divide-border border-y border-border">
                {[
                  { title: "Read a document", description: "Upload a file to inspect its contents.", content: <DocumentIntelligence /> },
                  { title: "Plan the work", description: "Turn the prompt into an ordered set of steps.", content: <AgentWorkflowPanel task={task} /> },
                  { title: "View task progress", description: "See the suggested stages and current status.", content: <AgentExecutionPanel task={task} /> },
                  { title: "Break down a project", description: "Review milestones, tasks, and potential risks.", content: <ProjectPlanPanel task={task} /> },
                  { title: "Check before release", description: "Review quality and readiness checks.", content: <ReleaseChecklistPanel task={task} /> },
                  { title: "Workspace status", description: "See platform health and provider availability.", content: <HealthMetricsPanel /> },
                ].map(({ title, description, content }) => (
                  <details key={title} className="group py-1">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-left marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
                      </span>
                      <ChevronDown size={16} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="pb-3">{content}</div>
                  </details>
                ))}
              </div>
            </section>
          </aside>

          <section className="order-2 min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5 lg:col-start-2 lg:row-span-2" aria-labelledby="workspace-output-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles size={14} className="text-primary" />
                <h2 id="workspace-output-heading">Code output</h2>
              </div>
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{WORKSPACE_TEMPLATES[language].label}</span>
            </div>

            <div role="status" className="mt-4 rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-muted-foreground">
              {summary}
            </div>

            <label htmlFor="workspace-code" className="sr-only">Edit generated code</label>
            <textarea
              id="workspace-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="mt-4 min-h-[480px] w-full resize-y rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Code2 size={13} className="text-primary" />
                Edit the starter above, then copy it into your project.
              </span>
              <span>{voiceStatus === "supported" ? "Voice input ready" : "Voice input not supported"}</span>
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Workspace;
