"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { mode, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="
        inline-flex h-10 w-10 items-center justify-center
        rounded-xl border border-border
        bg-card/30 backdrop-blur
        hover:bg-accent/40 transition
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
      "
      aria-label={mode === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      type="button"
    >
      {mode === "dark" ? (
        <Sun size={18} className="text-foreground" />
      ) : (
        <Moon size={18} className="text-foreground" />
      )}
    </button>
  );
}
