import { useRef, useState, type ChangeEvent } from "react";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { analyzeDocumentFile, getSupportedDocumentTypes, type DocumentAnalysisResult } from "@/lib/fileIntelligence";

const DocumentIntelligence = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDocumentFile(file);
      setResult(analysis);
    } catch (error) {
      console.error("Document analysis failed:", error);
      setResult({
        supported: false,
        requiresServerSide: true,
        fileName: file.name || "uploaded-file",
        fileType: file.type || "application/octet-stream",
        preview: "",
        message: "The document could not be read securely in the browser. A server-side parser is required.",
        size: file.size,
      });
    } finally {
      setIsAnalyzing(false);
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText size={14} className="text-primary" />
          Document intelligence
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-secondary"
        >
          <UploadCloud size={12} />
          Upload file
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={getSupportedDocumentTypes().join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3 text-xs text-muted-foreground">
        <div className="mb-2 font-medium text-foreground">Supported formats</div>
        <div className="flex flex-wrap gap-2">
          {getSupportedDocumentTypes().map((type) => (
            <span key={type} className="rounded-full border border-border px-2 py-1">
              {type}
            </span>
          ))}
        </div>
      </div>

      {isAnalyzing && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin text-primary" />
          Analyzing document...
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <span>{result.fileName}</span>
            <span className={result.supported ? "text-emerald-500" : "text-amber-500"}>
              {result.supported ? "supported" : result.requiresServerSide ? "server-side" : "unsupported"}
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-foreground">{result.message}</p>

          {result.preview && (
            <div className="mt-3 rounded-lg border border-border bg-background p-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-36 overflow-auto">
              {result.preview}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentIntelligence;
