import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileText,
  Trash2,
} from "lucide-react";
import type { SummarizedPaperRecord } from "../types/paper";
import { formatFileSize, formatPlainTextExport } from "../utils/format";
import { ThemeToggle, type ThemeMode } from "./ThemeToggle";

interface PaperSummaryViewProps {
  record: SummarizedPaperRecord;
  savedPapers: SummarizedPaperRecord[];
  activeSectionId: string;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  onSelectSection: (id: string) => void;
  onBackToUpload: () => void;
  onOpenSavedPaper: (record: SummarizedPaperRecord) => void;
  onDeleteSavedPaper: (id: string) => void;
}

const SECTION_META = [
  {
    id: "section-problem",
    num: "01",
    key: "problem" as const,
    label: "Problem",
    question: "What problem did the researchers want to fix?",
  },
  {
    id: "section-method",
    num: "02",
    key: "method" as const,
    label: "Method Used",
    question: "How did they try to solve it?",
  },
  {
    id: "section-dataset",
    num: "03",
    key: "dataset" as const,
    label: "Dataset",
    question: "What data or examples did they test on?",
  },
  {
    id: "section-results",
    num: "04",
    key: "results" as const,
    label: "Results",
    question: "What happened when they tested it?",
  },
  {
    id: "section-limitations",
    num: "05",
    key: "limitations" as const,
    label: "Limitations",
    question: "What could this study not do yet?",
  },
];

function renderParagraphs(text: string) {
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return parts.map((para, idx) => (
    <p
      key={idx}
      className="mt-3 first:mt-0 text-base leading-[1.75] text-slate-700 dark:text-slate-300"
    >
      {para}
    </p>
  ));
}

export function PaperSummaryView({
  record,
  savedPapers,
  activeSectionId,
  theme,
  onChangeTheme,
  onSelectSection,
  onBackToUpload,
  onOpenSavedPaper,
  onDeleteSavedPaper,
}: PaperSummaryViewProps) {
  const [copied, setCopied] = useState(false);
  const { summary } = record;

  const handleCopy = async () => {
    const text = formatPlainTextExport(record);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        // Ignore if copying is completely disallowed
      }
    }
  };

  const handleDownload = () => {
    const content = formatPlainTextExport(record);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const rawTitle = summary?.title || record.fileName || "paper-summary";
    const safeName = rawTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50);
    link.href = url;
    link.download = `${safeName || "paper-summary"}-notes.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 lg:py-12">
      {/* Paper Title & Authors Header */}
      <section className="border-b border-slate-200 pb-8 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={onBackToUpload}
              className="inline-flex items-center gap-1.5 font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer mr-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to upload</span>
            </button>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{record.fileName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{record.pageCount} pages</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {formatFileSize(record.fileSizeBytes)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {summary.readingTimeMinutes} min read
            </span>
            {summary.year && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{summary.year}</span>
              </>
            )}
          </div>

          <ThemeToggle theme={theme} onChangeTheme={onChangeTheme} />
        </div>

        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-[1.18] tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl text-balance">
          {summary?.title || record.fileName || "Untitled Paper"}
        </h1>

        <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
          By{" "}
          {Array.isArray(summary?.authors) && summary.authors.length > 0
            ? summary.authors.join(", ")
            : "Authors not listed"}
        </p>

        {summary?.oneLineOverview && (
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 dark:text-slate-300 sm:text-lg">
            {summary.oneLineOverview}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
          >
            {copied ? (
              <>
                <Check
                  className="h-4 w-4 text-emerald-700 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <span>Copied Notes</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Download .txt Notes</span>
          </button>

          <button
            type="button"
            onClick={onBackToUpload}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>Summarize Another PDF</span>
          </button>
        </div>
      </section>

      {/* Asymmetric Reading Workspace */}
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Navigation & Saved History Rail */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-8 space-y-6">
            <nav
              aria-label="Paper sections"
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Paper Breakdown
              </h2>
              <ul className="mt-4 space-y-1">
                {SECTION_META.map((item) => {
                  const isActive = activeSectionId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelectSection(item.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                          isActive
                            ? "bg-blue-50 font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                        }`}
                      >
                        <span className="font-mono text-xs tabular-nums text-slate-400 dark:text-slate-500">
                          {item.num}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectSection("section-takeaways")}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                      activeSectionId === "section-takeaways"
                        ? "bg-blue-50 font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                    }`}
                  >
                    <span className="font-mono text-xs tabular-nums text-slate-400 dark:text-slate-500">
                      06
                    </span>
                    <span className="truncate">5 Key Takeaways</span>
                  </button>
                </li>
              </ul>
            </nav>

            {/* Saved Papers Switcher */}
            <div
              id="saved-papers"
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Saved Papers
                </h2>
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                  {savedPapers.length}
                </span>
              </div>

              {savedPapers.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Your summarized papers will appear here.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                  {savedPapers.map((item) => {
                    const isCurrent = item.id === record.id;
                    const itemTitle =
                      item.summary?.title || item.fileName || "Untitled Paper";
                    return (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-2 py-2.5 first:pt-1 last:pb-0"
                      >
                        <button
                          type="button"
                          onClick={() => onOpenSavedPaper(item)}
                          className={`text-left text-sm leading-snug cursor-pointer ${
                            isCurrent
                              ? "font-semibold text-blue-800 dark:text-blue-300"
                              : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                          }`}
                        >
                          <span className="line-clamp-2">{itemTitle}</span>
                          <span className="mt-0.5 block font-mono text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                            {item.pageCount || 1} pages
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSavedPaper(item.id)}
                          aria-label={`Remove ${itemTitle}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </aside>

        {/* Main Reading Sheet: Simple 5-Part Breakdown + 5 Key Takeaways */}
        <article className="lg:col-span-8">
          <div className="rounded-xl border border-slate-200 bg-white p-7 sm:p-10 dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-10">
              {SECTION_META.map((item, idx) => (
                <section
                  key={item.id}
                  id={item.id}
                  className={
                    idx > 0
                      ? "scroll-mt-8 border-t border-slate-200 pt-8 dark:border-slate-800"
                      : "scroll-mt-8"
                  }
                >
                  <div className="flex items-baseline gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-medium text-blue-700 dark:text-blue-400 tabular-nums">
                      {item.num}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.question}</span>
                  </div>
                  <h2 className="mt-1.5 font-serif text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {item.label}
                  </h2>
                  <div className="mt-4 max-w-prose">
                    {renderParagraphs(summary?.sections?.[item.key] ?? "")}
                  </div>
                </section>
              ))}

              {/* 5 Key Takeaways */}
              <section
                id="section-takeaways"
                className="scroll-mt-8 border-t border-slate-200 pt-8 dark:border-slate-800"
              >
                <div className="flex items-baseline gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-medium text-blue-700 dark:text-blue-400 tabular-nums">
                    06
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>The most important points to remember</span>
                </div>
                <h2 className="mt-1.5 font-serif text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  5 Key Takeaways
                </h2>

                <ol className="mt-6 max-w-prose divide-y divide-slate-100 dark:divide-slate-800">
                  {(Array.isArray(summary?.keyTakeaways)
                    ? summary.keyTakeaways
                    : []
                  ).map((takeaway, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <span className="mt-0.5 font-mono text-sm font-semibold text-blue-700 dark:text-blue-400 tabular-nums shrink-0">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {takeaway.heading}
                        </h3>
                        <p className="mt-1 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                          {takeaway.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
