import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { extractText } from "unpdf";
import type { PaperSummaryData } from "../types/paper.ts";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new GeminiServiceError(
      "Your Gemini API key is not configured yet. Please add it in Settings > Secrets.",
      500
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export class GeminiServiceError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "GeminiServiceError";
    this.status = status;
  }
}

const SUMMARY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "The exact or clear title of the research paper.",
    },
    authors: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "List of author names from the paper. Return ['Authors not listed'] if none are visible.",
    },
    year: {
      type: Type.STRING,
      description:
        "Publication year if shown in the paper (for example '2024'), or empty string if unknown.",
    },
    oneLineOverview: {
      type: Type.STRING,
      description:
        "One short, friendly sentence in simple everyday English explaining what this paper is about.",
    },
    sections: {
      type: Type.OBJECT,
      properties: {
        problem: {
          type: Type.STRING,
          description:
            "Simple explanation (2 short paragraphs) of what problem the authors wanted to solve and why it matters in real life.",
        },
        method: {
          type: Type.STRING,
          description:
            "Simple explanation (2 short paragraphs) of how the researchers tried to solve the problem, using plain everyday words instead of heavy jargon.",
        },
        dataset: {
          type: Type.STRING,
          description:
            "Simple explanation (1 to 2 short paragraphs) of what data, people, experiments, or examples they tested their idea on.",
        },
        results: {
          type: Type.STRING,
          description:
            "Simple explanation (2 short paragraphs) of what happened in the tests and what key improvements or findings they saw.",
        },
        limitations: {
          type: Type.STRING,
          description:
            "Simple explanation (1 to 2 short paragraphs) of what the paper could not do, weak spots, or what still needs more work.",
        },
      },
      required: ["problem", "method", "dataset", "results", "limitations"],
    },
    keyTakeaways: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: {
            type: Type.STRING,
            description: "A short 4 to 8 word headline in simple English.",
          },
          detail: {
            type: Type.STRING,
            description:
              "One or two clear sentences in plain everyday English explaining this takeaway.",
          },
        },
        required: ["heading", "detail"],
      },
      description: "Exactly 5 key takeaways from the paper in simple words.",
    },
    readingTimeMinutes: {
      type: Type.INTEGER,
      description: "Estimated minutes for a student to read this summary (typically 2 to 5).",
    },
  },
  required: [
    "title",
    "authors",
    "year",
    "oneLineOverview",
    "sections",
    "keyTakeaways",
    "readingTimeMinutes",
  ],
};

const SYSTEM_INSTRUCTION = `You are a patient, helpful tutor who explains complex academic research papers to students in simple, clear, everyday English.

Follow these strict writing rules:
1. Use plain, everyday words (around an 8th-grade reading level). Never use complex academic English or dense jargon when a simple word works.
2. If you must mention a technical term from the paper, explain what it means right away in simple words inside parentheses.
3. Keep sentences short and clear. Break long explanations into 2 readable paragraphs separated by a blank line.
4. Stay strictly faithful to what is written in the paper. Never invent numbers, authors, datasets, or results that are not in the paper. If the paper does not use a traditional dataset (for example, a pure theory or survey paper), clearly explain what examples, studies, or materials the authors examined instead.
5. Always provide exactly 5 key takeaways in the keyTakeaways array.`;

function isTransientOrUnavailableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("high demand") ||
    msg.includes("500") ||
    msg.includes("INTERNAL") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("fetch failed")
  );
}

interface ModelAttempt {
  model: string;
  thinkingLevel: ThinkingLevel;
  timeoutMs: number;
}

const MODEL_ATTEMPTS: ModelAttempt[] = [
  { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 40000 },
  { model: "gemini-4-hydrogen", thinkingLevel: ThinkingLevel.LOW, timeoutMs: 40000 },
];

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`TIMEOUT: ${label} exceeded ${ms}ms`));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

const MAX_EXTRACTED_CHARS = 110000;

export interface ExtractedPdfInfo {
  text: string;
  pageCount: number | null;
}

export async function extractPdfInfo(pdfBuffer: Buffer): Promise<ExtractedPdfInfo> {
  try {
    const result = await extractText(new Uint8Array(pdfBuffer), {
      mergePages: false,
    });
    const pages = Array.isArray(result.text)
      ? result.text
      : [String(result.text ?? "")];
    const totalPages =
      typeof result.totalPages === "number" && result.totalPages > 0
        ? result.totalPages
        : pages.length > 0
          ? pages.length
          : null;

    const joined = pages
      .map((pageText, idx) => `[Page ${idx + 1}]\n${pageText.trim()}`)
      .join("\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (joined.length <= MAX_EXTRACTED_CHARS) {
      return { text: joined, pageCount: totalPages };
    }

    // Keep the beginning (title, authors, intro, method, dataset, results)
    // and the ending (discussion, limitations, conclusion)
    const head = joined.slice(0, 82000);
    const tail = joined.slice(-26000);
    return {
      text: `${head}\n\n[... middle pages trimmed for length ...]\n\n${tail}`,
      pageCount: totalPages,
    };
  } catch (err) {
    console.warn(
      "[pdf-extract] Falling back to multimodal PDF input:",
      err instanceof Error ? err.message : err
    );
    return { text: "", pageCount: null };
  }
}

export async function summarizePaperWithGemini(
  pdfBuffer: Buffer,
  fileName: string,
  knownPageCount?: number
): Promise<{ summary: PaperSummaryData; pageCount: number }> {
  const ai = getGeminiClient();

  const extracted = await extractPdfInfo(pdfBuffer);
  const pageCount = knownPageCount || extracted.pageCount || 1;
  const extractedText = extracted.text;
  const hasUsableText = extractedText.replace(/\s+/g, "").length >= 150;

  const contents = hasUsableText
    ? `Read the following research paper ("${fileName}", ${pageCount} pages) and explain it in simple, friendly English for a student.

Return:
- The paper title, authors, and publication year (if visible).
- A one-sentence overview in plain words.
- Simple-language explanations split into: Problem, Method Used, Dataset, Results, and Limitations.
- Exactly 5 key takeaways.

--- PAPER TEXT START ---
${extractedText}
--- PAPER TEXT END ---`
    : {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBuffer.toString("base64"),
            },
          },
          {
            text: `Read the attached scanned research paper PDF ("${fileName}", ${pageCount} pages) and explain it in simple, friendly English for a student.

Return:
- The paper title, authors, and publication year (if visible).
- A one-sentence overview in plain words.
- Simple-language explanations split into: Problem, Method Used, Dataset, Results, and Limitations.
- Exactly 5 key takeaways.`,
          },
        ],
      };

  let lastError: unknown = null;
  let responseText = "";

  for (let i = 0; i < MODEL_ATTEMPTS.length; i++) {
    const attempt = MODEL_ATTEMPTS[i];
    const started = Date.now();
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: attempt.model,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: SUMMARY_RESPONSE_SCHEMA,
            thinkingConfig: {
              thinkingLevel: attempt.thinkingLevel,
            },
          },
        }),
        attempt.timeoutMs,
        attempt.model
      );
      responseText = (response.text ?? "").trim();
      console.log(
        `[gemini] ${attempt.model} (${hasUsableText ? "text" : "pdf"}) succeeded in ${Date.now() - started}ms`
      );
      if (responseText) {
        break;
      }
    } catch (error) {
      lastError = error;
      console.error(
        `[gemini] attempt ${i + 1} (${attempt.model}) failed after ${Date.now() - started}ms:`,
        error instanceof Error ? error.message : error
      );

      const isTimeout =
        error instanceof Error && error.message.startsWith("TIMEOUT:");
      if (!isTransientOrUnavailableError(error) && !isTimeout) {
        break;
      }

      if (i < MODEL_ATTEMPTS.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  }

  if (!responseText) {
    if (lastError) {
      const message =
        lastError instanceof Error ? lastError.message : String(lastError);

      if (
        message.includes("API_KEY_INVALID") ||
        message.includes("PERMISSION_DENIED") ||
        message.includes("403")
      ) {
        throw new GeminiServiceError(
          "Your Gemini API key is missing or not valid. Please check Settings > Secrets.",
          403
        );
      }

      if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
        throw new GeminiServiceError(
          "Too many requests right now. Please wait a few seconds and try again.",
          429
        );
      }

      if (
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.startsWith("TIMEOUT:")
      ) {
        throw new GeminiServiceError(
          "The AI service took too long or is busy right now. Please try again in a few seconds.",
          503
        );
      }

      if (message.includes("400") || message.includes("INVALID_ARGUMENT")) {
        throw new GeminiServiceError(
          "This PDF could not be read. Please make sure it is a normal, unencrypted PDF under 20 MB.",
          400
        );
      }
    }

    throw new GeminiServiceError(
      "Could not finish reading this paper right now. Please try again in a moment.",
      502
    );
  }

  try {
    const cleanedJson = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleanedJson) as PaperSummaryData;
    const takeaways = Array.isArray(parsed.keyTakeaways)
      ? parsed.keyTakeaways.slice(0, 5)
      : [];

    const summary: PaperSummaryData = {
      title: parsed.title?.trim() || fileName.replace(/\.pdf$/i, ""),
      authors:
        Array.isArray(parsed.authors) && parsed.authors.length > 0
          ? parsed.authors
          : ["Authors not listed"],
      year: parsed.year?.trim() || "",
      oneLineOverview: parsed.oneLineOverview?.trim() || "",
      sections: {
        problem:
          parsed.sections?.problem?.trim() || "Not clearly stated in the paper.",
        method:
          parsed.sections?.method?.trim() || "Not clearly stated in the paper.",
        dataset:
          parsed.sections?.dataset?.trim() || "No specific dataset was described.",
        results:
          parsed.sections?.results?.trim() || "Not clearly stated in the paper.",
        limitations:
          parsed.sections?.limitations?.trim() ||
          "No limitations were listed by the authors.",
      },
      keyTakeaways: takeaways,
      readingTimeMinutes:
        typeof parsed.readingTimeMinutes === "number" &&
        parsed.readingTimeMinutes > 0
          ? Math.min(Math.max(Math.round(parsed.readingTimeMinutes), 1), 15)
          : 3,
    };

    return { summary, pageCount };
  } catch (parseErr) {
    console.error("Failed to parse Gemini JSON output:", parseErr);
    throw new GeminiServiceError(
      "The summary response was incomplete. Please try summarizing this PDF again.",
      502
    );
  }
}
