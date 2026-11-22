import { Moon, Sun } from "lucide-react";

export type ThemeMode = "light" | "dark";

interface ThemeToggleProps {
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
}

export function ThemeToggle({ theme, onChangeTheme }: ThemeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900 shrink-0"
    >
      <button
        type="button"
        aria-pressed={theme === "light"}
        onClick={() => onChangeTheme("light")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[32px] ${
          theme === "light"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        }`}
      >
        <Sun className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Light</span>
      </button>
      <button
        type="button"
        aria-pressed={theme === "dark"}
        onClick={() => onChangeTheme("dark")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[32px] ${
          theme === "dark"
            ? "bg-slate-800 text-slate-100 shadow-sm"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        }`}
      >
        <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Dark</span>
      </button>
    </div>
  );
}
