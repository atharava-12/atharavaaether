import { useState } from "react";
import { AlertCircle, ArrowUpRight, BookOpen, LoaderCircle, Search, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { buildResearchPlan, fetchResearchResults, streamResearchAnswer } from "@/lib/research";
import type { ModelId } from "@/lib/models";

type SearchState = "idle" | "local" | "searching" | "found" | "empty" | "unavailable";

const ResearchPanel = ({ modelId }: { modelId: ModelId }) => {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [liveResults, setLiveResults] = useState<Array<{ title: string; url: string; description: string }>>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const plan = buildResearchPlan(query);
  const hasLiveSearch = plan.provider !== "local";

  const updateQuery = (value: string) => {
    setQuery(value);
    setAnswer("");
    setLiveResults([]);
    setSearchState("idle");
    setError("");
  };

  const handleGenerate = async () => {
    const researchQuestion = query.trim();
    if (!researchQuestion || isGenerating) return;

    setIsGenerating(true);
    setAnswer("");
    setLiveResults([]);
    setError("");
    let sources: Array<{ title: string; url: string; description: string }> = [];

    if (!hasLiveSearch) {
      setSearchState("local");
    } else {
      setSearchState("searching");
      try {
        const results = await fetchResearchResults(researchQuestion);
        const usedFallback = results.some((result) => result.url.includes("example.com"));
        sources = usedFallback ? [] : results;
        setLiveResults(sources);
        setSearchState(usedFallback ? "unavailable" : sources.length > 0 ? "found" : "empty");
      } catch {
        setSearchState("unavailable");
      }
    }

    try {
      await streamResearchAnswer(researchQuestion, sources, (chunk) => {
        setAnswer((currentAnswer) => currentAnswer + chunk);
      }, modelId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Research could not be completed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
            <Search size={17} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Research a question</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Get a clear starting brief, then check the sources behind it.
            </p>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
          hasLiveSearch
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            : "border-amber-500/20 bg-amber-500/10 text-amber-500"
        }`}>
          {hasLiveSearch ? "AI + live web search" : "AI answer · no live web"}
        </span>
      </header>

      <section className="space-y-3" aria-label="Research question">
        <label htmlFor="research-question" className="text-sm font-medium text-foreground">
          What do you want to find out?
        </label>
        <textarea
          id="research-question"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void handleGenerate();
          }}
          rows={3}
          className="w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="For example: Compare the leading AI note-taking apps for a small team"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Be specific about the topic, audience, or decision.</p>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={!query.trim() || isGenerating}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {isGenerating ? "Preparing your brief..." : "Create research brief"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Example questions">
          {["Compare the options", "Explain a new topic"].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => updateQuery(example === "Compare the options" ? "Compare the leading options for my needs" : "Explain the latest developments in this topic")}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      </section>

      {!hasLiveSearch && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-relaxed text-muted-foreground">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <p>
            Live web search isn’t connected. Your answer will be AI-generated, without current web results or verified citations.
          </p>
        </div>
      )}

      {(answer || isGenerating || error) && (
        <section className="space-y-4 border-t border-border pt-5" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Your research brief</h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {searchState === "found" ? "Uses live web results" : "AI-generated answer"}
            </span>
          </div>

          {answer && (
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="prose-aether text-sm leading-relaxed">
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
          </div>
          )}

          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle size={14} className="animate-spin text-primary" />
              {searchState === "searching" ? "Looking for web sources..." : "Writing your research answer..."}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {searchState === "unavailable" && (
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-muted-foreground">
              Web search couldn’t be completed, so this brief has no live sources. Try again later or check your search connection.
            </p>
          )}

          {searchState === "empty" && (
            <p className="rounded-xl border border-border bg-background/60 p-3 text-sm text-muted-foreground">
              No web sources were found for this question. Try different wording.
            </p>
          )}

          {liveResults.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground">Web sources</h4>
              <ul className="mt-2 space-y-2">
                {liveResults.map((result) => (
                  <li key={result.url} className="rounded-xl border border-border bg-background/60 p-3">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {result.title}
                      <ArrowUpRight size={13} />
                    </a>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ResearchPanel;