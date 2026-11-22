import { useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  FileText,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import studyIllustration from "../assets/images/study_paper_editorial_1794747121218.jpg";
import type { SamplePaperMeta, SummarizedPaperRecord } from "../types/paper";
import { formatFileSize } from "../utils/format";
import { ThemeToggle, type ThemeMode } from "./ThemeToggle";

interface UploadStageProps {
  samples: SamplePaperMeta[];
  savedPapers: SummarizedPaperRecord[];
  isLoading: boolean;
  loadingLabel: string;
  errorMessage: string | null;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  onSelectFile: (file: File) => void;
  onRunSample: (sampleId: string) => void;
  onCancelLoading: () => void;
  onDismissError: () => void;
  onOpenSavedPaper: (record: SummarizedPaperRecord) => void;
  onDeleteSavedPaper: (id: string) => void;
}

export function UploadStage({
  samples,
  savedPapers,
  isLoading,
  loadingLabel,
  errorMessage,
  theme,
  onChangeTheme,
  onSelectFile,
  onRunSample,
  onCancelLoading,
  onDismissError,
  onOpenSavedPaper,
  onDeleteSavedPaper,
}: UploadStageProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onSelectFile(files[0]);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      {/* Hero 2-column split */}
      <section className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left: Headline + Upload Dropzone */}
        <div className="flex flex-col justify-between lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Plain-English Research Helper
              </p>
              <ThemeToggle theme={theme} onChangeTheme={onChangeTheme} />
            </div>

            <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl text-balance">
              Read any research paper in simple words
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              Academic papers are long and full of hard terms. Upload a PDF below
              and get the title, authors, a simple 5-part explanation, and 5 key
              takeaways in under a minute.
            </p>
          </div>

          {/* Dropzone or Loading panel */}
          <div className="mt-8">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              aria-label="Choose a research paper PDF file"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {isLoading ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                        Reading your paper
                      </h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {loadingLabel}
                      </p>
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Writing the problem, method, dataset, results, limitations,
                        and 5 takeaways in simple English.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onCancelLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={`rounded-xl border border-dashed p-8 transition-colors ${
                  isDragging
                    ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30"
                    : "border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <FileText className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                        Drop your research paper PDF here
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Works with any academic PDF up to 20 MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
                  >
                    <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Choose PDF</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-400"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-semibold">Could not read file: </span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onDismissError}
                  aria-label="Close error message"
                  className="rounded p-1 text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/40 cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Sample papers */}
            {samples.length > 0 && !isLoading && (
              <div className="mt-5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Do not have a PDF ready? Try one of these sample papers:
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  {samples.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => onRunSample(sample.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/60 dark:hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
                    >
                      <BookOpen
                        className="h-4 w-4 text-blue-700 dark:text-blue-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{sample.shortTitle}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Editorial Illustration */}
        <div className="flex flex-col lg:col-span-5">
          <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {!imageFailed ? (
              <img
                src={studyIllustration}
                alt="Open research paper next to clear handwritten study notes and a desk lamp"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="h-full min-h-[260px] w-full object-cover dark:brightness-95"
              />
            ) : (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-8 text-center">
                <BookOpen
                  className="h-10 w-10 text-blue-700 dark:text-blue-400"
                  aria-hidden="true"
                />
                <p className="mt-3 font-serif text-lg font-medium text-slate-900 dark:text-slate-50">
                  Clear Study Notes
                </p>
                <p className="mt-1 max-w-xs text-sm text-slate-600 dark:text-slate-400">
                  Problem, method, dataset, results, limitations, and 5 takeaways.
                </p>
              </div>
            )}
          </div>
          <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
            Turns long academic PDFs into clear, easy-to-read study notes.
          </p>
        </div>
      </section>

      {/* 3-step explanation strip */}
      <section
        id="what-you-get"
        className="mt-14 border-t border-slate-200 pt-10 dark:border-slate-800"
      >
        <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-slate-50">
          What you get from every paper
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <p className="font-mono text-xs font-medium text-blue-700 dark:text-blue-400 tabular-nums">
              01
            </p>
            <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              Title and Authors
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Cleanly pulls the paper title, who wrote it, and a one-sentence
              overview so you know the main topic right away.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs font-medium text-blue-700 dark:text-blue-400 tabular-nums">
              02
            </p>
            <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              5-Part Simple Breakdown
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Splits the whole study into Problem, Method Used, Dataset, Results,
              and Limitations using everyday words.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs font-medium text-blue-700 dark:text-blue-400 tabular-nums">
              03
            </p>
            <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              5 Key Takeaways
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Gives you the 5 most important points to remember for class,
              presentations, or exam review.
            </p>
          </div>
        </div>
      </section>

      {/* Saved Papers History */}
      <section
        id="saved-papers"
        className="mt-14 border-t border-slate-200 pt-10 dark:border-slate-800"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Saved Notes
          </h2>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {savedPapers.length} {savedPapers.length === 1 ? "paper" : "papers"}
          </span>
        </div>

        {savedPapers.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Papers you summarize will appear here automatically so you can open
            them again anytime.
          </p>
        ) : (
          <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {savedPapers.map((item) => {
              const title =
                item.summary?.title || item.fileName || "Untitled Paper";
              const authors = Array.isArray(item.summary?.authors)
                ? item.summary.authors.slice(0, 2).join(", ")
                : "Authors not listed";
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => onOpenSavedPaper(item)}
                    className="text-left group cursor-pointer"
                  >
                    <h3 className="font-serif text-lg font-medium text-slate-900 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-400 transition-colors">
                      {title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{authors}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {item.pageCount || 1} pages
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatFileSize(item.fileSizeBytes)}
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenSavedPaper(item)}
                      className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
                    >
                      Open Notes
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSavedPaper(item.id)}
                      aria-label={`Remove ${title} from saved notes`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
