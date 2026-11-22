import { Upload } from "lucide-react";

interface TopBarProps {
  hasActivePaper: boolean;
  savedCount: number;
  isLoading: boolean;
  onGoHome: () => void;
  onJumpToSection: (sectionId: string) => void;
  onTriggerUpload: () => void;
}

export function TopBar({
  hasActivePaper,
  savedCount,
  isLoading,
  onGoHome,
  onJumpToSection,
  onTriggerUpload,
}: TopBarProps) {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={onGoHome}
          className="font-serif text-xl font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-700 dark:text-slate-50 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          PaperPlain
        </button>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <button
            type="button"
            onClick={onGoHome}
            className="whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            Upload Paper
          </button>
          <button
            type="button"
            onClick={() =>
              onJumpToSection(hasActivePaper ? "section-problem" : "what-you-get")
            }
            className="whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            Simple Summary
          </button>
          <button
            type="button"
            onClick={() =>
              onJumpToSection(
                hasActivePaper ? "section-takeaways" : "what-you-get"
              )
            }
            className="whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            5 Takeaways
          </button>
          <button
            type="button"
            onClick={() => onJumpToSection("saved-papers")}
            className="whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            Saved Notes{savedCount > 0 ? ` (${savedCount})` : ""}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            disabled={isLoading}
            onClick={onTriggerUpload}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
          >
            <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
}
