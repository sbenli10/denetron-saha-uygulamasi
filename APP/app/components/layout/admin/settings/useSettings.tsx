"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";
export type AccentMode = "amber" | "emerald" | "sky" | "violet";
export type SidebarMode = "hover" | "click" | "always";

export type EffectsState = {
  glow: boolean;
  grid: boolean;
  scanline: boolean;
};

export type SettingsState = {
  theme: ThemeMode;
  accent: AccentMode;
  sidebarMode: SidebarMode;
  effects: EffectsState;
};

type SettingsContextType = {
  settings: SettingsState;
  setSettings: (s: SettingsState) => void;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

const DEFAULTS: SettingsState = {
  theme: "light",
  accent: "violet",
  sidebarMode: "hover",
  effects: { glow: false, grid: false, scanline: false },
};


export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);

  useEffect(() => {
    const saved = localStorage.getItem("denetron-settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {
        setSettings(DEFAULTS);
      }
    }
  }, []);

  // ThemeProvider -> SettingsProvider senkronu
  useEffect(() => {
    const onTheme = (e: Event) => {
      const next = (e as CustomEvent).detail as ThemeMode;
      setSettings((prev) => ({ ...prev, theme: next }));
    };

    const onAccent = (e: Event) => {
      const next = (e as CustomEvent).detail as AccentMode;
      setSettings((prev) => ({ ...prev, accent: next }));
    };

    window.addEventListener("denetron:set-theme", onTheme as any);
    window.addEventListener("denetron:set-accent", onAccent as any);
    return () => {
      window.removeEventListener("denetron:set-theme", onTheme as any);
      window.removeEventListener("denetron:set-accent", onAccent as any);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("denetron-settings", JSON.stringify(settings));

    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.accent = settings.accent;
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider />");
  return ctx;
}
