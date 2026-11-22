/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { PaperSummaryView } from "./components/PaperSummaryView";
import { type ThemeMode } from "./components/ThemeToggle";
import { TopBar } from "./components/TopBar";
import { UploadStage } from "./components/UploadStage";
import type { SamplePaperMeta, SummarizedPaperRecord } from "./types/paper";
import {
  isValidPaperRecord,
  loadSavedPapers,
  savePapersToStorage,
} from "./utils/format";

const THEME_STORAGE_KEY = "paperplain_theme";

function getInitialTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {
    // Ignore storage access errors
  }
  return "dark";
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleReset = () => {
    try {
      window.localStorage.removeItem("paperplain_saved_summaries_v1");
    } catch {
      // Ignore storage errors
    }
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <h1 className="font-serif text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              The page ran into an unexpected display error. Click below to
              return to a clean start.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors cursor-pointer"
            >
              Reset App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function PaperPlainApp() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [samples, setSamples] = useState<SamplePaperMeta[]>([]);
  const [savedPapers, setSavedPapers] = useState<SummarizedPaperRecord[]>(() =>
    loadSavedPapers()
  );
  const [activePaper, setActivePaper] = useState<SummarizedPaperRecord | null>(
    null
  );
  const [activeSectionId, setActiveSectionId] = useState("section-problem");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const hiddenTopFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors
    }
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/samples")
      .then((res) => (res.ok ? res.json() : { samples: [] }))
      .then((data) => {
        if (mounted && Array.isArray(data.samples)) {
          setSamples(data.samples);
        }
      })
      .catch(() => {
        // Sample list is optional; ignore fetch error cleanly
      });

    return () => {
      mounted = false;
    };
  }, []);

  const addSavedPaper = (record: SummarizedPaperRecord) => {
    if (!isValidPaperRecord(record)) return;
    setSavedPapers((prev) => {
      const filtered = prev.filter((item) => item.id !== record.id);
      const next = [record, ...filtered].slice(0, 12);
      savePapersToStorage(next);
      return next;
    });
  };

  const handleDeleteSavedPaper = (id: string) => {
    setSavedPapers((prev) => {
      const next = prev.filter((item) => item.id !== id);
      savePapersToStorage(next);
      return next;
    });
    if (activePaper?.id === id) {
      setActivePaper(null);
    }
  };

  const handleSelectFile = async (file: File) => {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setErrorMessage("Please select a PDF file (.pdf).");
      return;
    }

    if (file.size === 0) {
      setErrorMessage("This file is empty. Please choose a valid PDF.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("This PDF is larger than 20 MB. Please choose a smaller file.");
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setErrorMessage(null);
    setActivePaper(null);
    setIsLoading(true);
    setLoadingLabel(`Reading "${file.name}" and writing simple notes...`);

    try {
      const formData = new FormData();
      formData.append("paper", file);

      const response = await fetch("/api/summarize", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const rawText = await response.text();
      let data: Partial<SummarizedPaperRecord> & { error?: string } = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        // Non-JSON proxy/server error
      }

      if (!response.ok || !isValidPaperRecord(data)) {
        throw new Error(
          data.error ||
            "Could not summarize this PDF right now. Please try again."
        );
      }

      addSavedPaper(data);
      setActivePaper(data);
      setActiveSectionId("section-problem");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSample = async (sampleId: string) => {
    const sample = samples.find((s) => s.id === sampleId);
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setErrorMessage(null);
    setActivePaper(null);
    setIsLoading(true);
    setLoadingLabel(
      `Reading "${sample?.shortTitle || "sample paper"}" and writing simple notes...`
    );

    try {
      const response = await fetch(`/api/summarize-sample/${sampleId}`, {
        method: "POST",
        signal: controller.signal,
      });

      const rawText = await response.text();
      let data: Partial<SummarizedPaperRecord> & { error?: string } = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        // Non-JSON proxy/server error
      }

      if (!response.ok || !isValidPaperRecord(data)) {
        throw new Error(
          data.error ||
            "Could not summarize this sample paper right now. Please try again."
        );
      }

      addSavedPaper(data);
      setActivePaper(data);
      setActiveSectionId("section-problem");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelLoading = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  const handleJumpToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleGoHome = () => {
    setActivePaper(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <input
        ref={hiddenTopFileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label="Upload a PDF research paper"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSelectFile(file);
          e.target.value = "";
        }}
      />

      <TopBar
        hasActivePaper={Boolean(activePaper)}
        savedCount={savedPapers.length}
        isLoading={isLoading}
        onGoHome={handleGoHome}
        onJumpToSection={handleJumpToSection}
        onTriggerUpload={() => hiddenTopFileInputRef.current?.click()}
      />

      <div className="flex-1">
        {activePaper ? (
          <PaperSummaryView
            record={activePaper}
            savedPapers={savedPapers}
            activeSectionId={activeSectionId}
            theme={theme}
            onChangeTheme={setTheme}
            onSelectSection={handleJumpToSection}
            onBackToUpload={handleGoHome}
            onOpenSavedPaper={(record) => {
              setActivePaper(record);
              setActiveSectionId("section-problem");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onDeleteSavedPaper={handleDeleteSavedPaper}
          />
        ) : (
          <UploadStage
            samples={samples}
            savedPapers={savedPapers}
            isLoading={isLoading}
            loadingLabel={loadingLabel}
            errorMessage={errorMessage}
            theme={theme}
            onChangeTheme={setTheme}
            onSelectFile={handleSelectFile}
            onRunSample={handleRunSample}
            onCancelLoading={handleCancelLoading}
            onDismissError={() => setErrorMessage(null)}
            onOpenSavedPaper={(record) => {
              setActivePaper(record);
              setActiveSectionId("section-problem");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onDeleteSavedPaper={handleDeleteSavedPaper}
          />
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>PaperPlain · Research summaries in everyday English</span>
          <span>Upload any PDF up to 20 MB</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <PaperPlainApp />
    </AppErrorBoundary>
  );
}
