import type { SummarizedPaperRecord } from "../types/paper";

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function isValidPaperRecord(item: unknown): item is SummarizedPaperRecord {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Record<string, unknown>;
  if (typeof candidate.id !== "string" || !candidate.id) return false;

  const summary = candidate.summary;
  if (!summary || typeof summary !== "object") return false;
  const s = summary as Record<string, unknown>;
  if (typeof s.title !== "string") return false;

  const sections = s.sections;
  if (!sections || typeof sections !== "object") return false;

  return true;
}

export function formatPlainTextExport(record: SummarizedPaperRecord): string {
  const summary = record.summary;
  const authors = Array.isArray(summary?.authors)
    ? summary.authors.join(", ")
    : "Authors not listed";
  const takeaways = Array.isArray(summary?.keyTakeaways)
    ? summary.keyTakeaways
    : [];

  const lines: string[] = [
    summary?.title || record.fileName || "Research Paper Summary",
    `Authors: ${authors}${summary?.year ? ` (${summary.year})` : ""}`,
    `Source PDF: ${record.fileName || "paper.pdf"} (${record.pageCount || 1} pages)`,
    "",
    "IN ONE SENTENCE",
    summary?.oneLineOverview || "",
    "",
    "1. PROBLEM",
    summary?.sections?.problem || "",
    "",
    "2. METHOD USED",
    summary?.sections?.method || "",
    "",
    "3. DATASET",
    summary?.sections?.dataset || "",
    "",
    "4. RESULTS",
    summary?.sections?.results || "",
    "",
    "5. LIMITATIONS",
    summary?.sections?.limitations || "",
    "",
    "5 KEY TAKEAWAYS",
    ...takeaways.map(
      (item, index) => `${index + 1}. ${item.heading}\n   ${item.detail}`
    ),
  ];
  return lines.join("\n");
}

const STORAGE_KEY = "paperplain_saved_summaries_v1";

export function loadSavedPapers(): SummarizedPaperRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(isValidPaperRecord);
    if (valid.length !== parsed.length) {
      savePapersToStorage(valid);
    }
    return valid;
  } catch {
    return [];
  }
}

export function savePapersToStorage(records: SummarizedPaperRecord[]): void {
  try {
    const valid = records.filter(isValidPaperRecord).slice(0, 12);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
  } catch {
    // Ignore storage quota errors cleanly
  }
}
