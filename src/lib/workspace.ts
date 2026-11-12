export type WorkspaceLanguage = "typescript" | "javascript" | "python" | "sql" | "json";

export interface WorkspaceTemplate {
  language: WorkspaceLanguage;
  label: string;
  starter: string;
  description: string;
}

export const WORKSPACE_TEMPLATES: Record<WorkspaceLanguage, WorkspaceTemplate> = {
  typescript: {
    language: "typescript",
    label: "TypeScript",
    description: "Typed frontend and API logic",
    starter: `type FetchState = "idle" | "loading" | "success" | "error";

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(\`Request failed: \${response.status}\`);
  }
  return response.json() as Promise<T>;
}`,
  },
  javascript: {
    language: "javascript",
    label: "JavaScript",
    description: "Fast browser logic",
    starter: `export async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Request failed: ' + response.status);
  }
  return response.json();
}`,
  },
  python: {
    language: "python",
    label: "Python",
    description: "Data processing and automation",
    starter: `def fetch_json(url: str):
    import json
    import urllib.request

    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode("utf-8"))`,
  },
  sql: {
    language: "sql",
    label: "SQL",
    description: "Database queries",
    starter: `SELECT user_id, COUNT(*) as total_orders
FROM orders
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY total_orders DESC;`,
  },
  json: {
    language: "json",
    label: "JSON",
    description: "Structured config and payloads",
    starter: `{
  "name": "chitchat-workspace",
  "version": "1.0.0",
  "features": ["chat", "voice", "coding"]
}`,
  },
};

export const getWorkspaceTemplate = (language: WorkspaceLanguage) => WORKSPACE_TEMPLATES[language];

export const buildCodeSuggestion = (language: WorkspaceLanguage, task: string) => {
  const lowerTask = task.toLowerCase();
  const base = getWorkspaceTemplate(language).starter;

  if (lowerTask.includes("debounce") && language === "typescript") {
    return `export function debounce<T extends (...args: any[]) => void>(fn: T, delay = 250) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      await fetch("/api/search", { method: "POST" });
      fn(...args);
    }, delay);
  };
}`;
  }

  if (lowerTask.includes("fetch") || lowerTask.includes("api")) {
    return base;
  }

  if (lowerTask.includes("sort") || lowerTask.includes("filter")) {
    return `const items = [
  { name: "alpha", score: 10 },
  { name: "beta", score: 7 },
  { name: "gamma", score: 12 },
];

const sorted = [...items].sort((a, b) => b.score - a.score);
console.log(sorted);`;
  }

  return base;
};

export const summarizeCode = (code: string, language: WorkspaceLanguage) => {
  const trimmed = code.trim();
  const keyTokens = trimmed.match(/[A-Za-z_][A-Za-z0-9_]{2,}/g) ?? ["snippet"];
  const mainToken = keyTokens.slice(0, 3).join(", ");
  return `This TypeScript workspace snippet defines ${mainToken}. It is structured for a focused coding task and is ready for review, testing, or refactoring.`.replace(
    "TypeScript",
    getWorkspaceTemplate(language).label,
  );
};

export const getVoiceSupportStatus = (): "supported" | "unsupported" => {
  if (typeof window === "undefined") return "unsupported";
  const hasRecognition = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  return hasRecognition ? "supported" : "unsupported";
};
