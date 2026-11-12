import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";
import mammoth from "mammoth/mammoth.browser";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const SUPPORTED_DOCUMENT_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/html",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type DocumentAnalysisResult = {
  supported: boolean;
  requiresServerSide: boolean;
  fileName: string;
  fileType: string;
  preview: string;
  message: string;
  size: number;
};

const isTextLike = (fileName: string, mimeType: string) => {
  const lowerName = fileName.toLowerCase();
  return mimeType.startsWith("text/")
    || lowerName.endsWith(".txt")
    || lowerName.endsWith(".md")
    || lowerName.endsWith(".csv")
    || lowerName.endsWith(".json")
    || lowerName.endsWith(".html");
};

const isServerSideDocument = (fileName: string, mimeType: string) => {
  const lowerName = fileName.toLowerCase();
  return mimeType.includes("officedocument") && !mimeType.includes("wordprocessingml.document")
    || lowerName.endsWith(".pptx")
    || lowerName.endsWith(".xlsx")
    || lowerName.endsWith(".doc")
    || lowerName.endsWith(".ppt")
    || lowerName.endsWith(".xls");
};

export const getSupportedDocumentTypes = () => [...SUPPORTED_DOCUMENT_TYPES];

const readPdfText = async (file: File) => {
  const document = await pdfjs.getDocument({ data: await readFileArrayBuffer(file) }).promise;
  const pages: string[] = [];
  const maxPages = Math.min(document.numPages, 30);
  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
  }
  return pages.join("\n");
};

const readDocxText = async (file: File) => {
  const result = await mammoth.extractRawText({ arrayBuffer: await readFileArrayBuffer(file) });
  return result.value;
};

const readFileText = async (file: File): Promise<string> => {
  if (typeof file.text === "function") return file.text();

  if (typeof file.arrayBuffer === "function") {
    const buffer = await file.arrayBuffer();
    return new TextDecoder().decode(buffer);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read uploaded file"));
    reader.readAsText(file);
  });
};

const readFileArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => reader.result instanceof ArrayBuffer
      ? resolve(reader.result)
      : reject(new Error("Could not read uploaded file"));
    reader.onerror = () => reject(new Error("Could not read uploaded file"));
    reader.readAsArrayBuffer(file);
  });
};

export const analyzeDocumentFile = async (file: File): Promise<DocumentAnalysisResult> => {
  const mimeType = file.type || "application/octet-stream";
  const fileName = file.name || "uploaded-file";

  if (isTextLike(fileName, mimeType)) {
    const text = await readFileText(file);
    const preview = text.replace(/\s+/g, " ").slice(0, 1200).trim();
    return {
      supported: true,
      requiresServerSide: false,
      fileName,
      fileType: mimeType,
      preview: preview || "No readable text content found in the uploaded file.",
      message: "Text-based document analysis is supported in-browser. Advanced PDF and office parsing requires a server-side document parser.",
      size: file.size,
    };
  }

  if (file.size > 8 * 1024 * 1024) {
    return {
      supported: false,
      requiresServerSide: false,
      fileName,
      fileType: mimeType,
      preview: "",
      message: "Files must be smaller than 8 MB.",
      size: file.size,
    };
  }

  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    let text = "";
    try {
      text = await readPdfText(file);
    } catch {}
    const preview = text.replace(/\s+/g, " ").slice(0, 1200).trim();
    return {
      supported: Boolean(preview),
      requiresServerSide: false,
      fileName,
      fileType: mimeType,
      preview,
      message: preview
        ? "Selectable PDF text was extracted in your browser. Scanned pages need OCR and are not processed yet."
        : "PDF text could not be extracted. Scanned pages need OCR, which is not available yet.",
      size: file.size,
    };
  }

  if (mimeType.includes("wordprocessingml.document") || fileName.toLowerCase().endsWith(".docx")) {
    let text = "";
    try {
      text = await readDocxText(file);
    } catch {}
    const preview = text.replace(/\s+/g, " ").slice(0, 1200).trim();
    return {
      supported: Boolean(preview),
      requiresServerSide: false,
      fileName,
      fileType: mimeType,
      preview,
      message: preview ? "Text was extracted from this DOCX file in your browser." : "No readable text could be extracted from this DOCX file.",
      size: file.size,
    };
  }

  if (isServerSideDocument(fileName, mimeType)) {
    return {
      supported: false,
      requiresServerSide: true,
      fileName,
      fileType: mimeType,
      preview: "",
      message: "This document type requires a server-side parser and OCR pipeline before it can be analyzed safely.",
      size: file.size,
    };
  }

  return {
    supported: false,
    requiresServerSide: true,
    fileName,
    fileType: mimeType,
    preview: "",
    message: "Unsupported upload type. Secure document processing must be configured server-side for this file format.",
    size: file.size,
  };
};
