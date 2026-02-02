"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import "../theme/ThemeVariables.css";
import { useSettings } from "../settings/useSettings";

type ThemeMode = "light" | "dark";

const ThemeContext = createContext({
  mode: "light" as ThemeMode,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Settings varsa onu kullan, yoksa internal state’e düş
  let settingsCtx: ReturnType<typeof useSettings> | null = null;
  try {
    settingsCtx = useSettings();
  } catch {
    settingsCtx = null;
  }

  const [mode, setMode] = useState<ThemeMode>("light");

  // Settings yoksa bile data-theme set et
  useEffect(() => {
    if (!settingsCtx) {
      document.documentElement.dataset.theme = mode;
    }
  }, [mode, settingsCtx]);

  const value = useMemo(() => {
    if (settingsCtx) {
      const { settings, setSettings } = settingsCtx;
      const current = settings.theme as ThemeMode;

      return {
        mode: current,
        toggle: () =>
          setSettings({
            ...settings,
            theme: current === "dark" ? "light" : "dark",
          }),
      };
    }

    return {
      mode,
      toggle: () => setMode((p) => (p === "dark" ? "light" : "dark")),
    };
  }, [settingsCtx, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
