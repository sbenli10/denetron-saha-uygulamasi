"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  /** Hydration-safe: true after client mount */
  mounted: boolean;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

const STORAGE_KEY = "denetron-settings";

const DEFAULTS: SettingsState = {
  theme: "light",
  accent: "violet",
  sidebarMode: "hover",
  effects: { glow: false, grid: false, scanline: false },
};

function isTheme(v: any): v is ThemeMode {
  return v === "light" || v === "dark";
}
function isAccent(v: any): v is AccentMode {
  return v === "amber" || v === "emerald" || v === "sky" || v === "violet";
}
function isSidebarMode(v: any): v is SidebarMode {
  return v === "hover" || v === "click" || v === "always";
}

function normalizeEffects(v: any): EffectsState {
  const e = v ?? {};
  return {
    glow: Boolean(e.glow),
    grid: Boolean(e.grid),
    scanline: Boolean(e.scanline),
  };
}

/**
 * ✅ Safe normalize + deep merge with defaults
 * - accepts partial / old schema / wrong values
 * - never throws
 */
function normalizeSettings(input: any): SettingsState {
  const s = input ?? {};
  return {
    theme: isTheme(s.theme) ? s.theme : DEFAULTS.theme,
    accent: isAccent(s.accent) ? s.accent : DEFAULTS.accent,
    sidebarMode: isSidebarMode(s.sidebarMode) ? s.sidebarMode : DEFAULTS.sidebarMode,
    effects: normalizeEffects(s.effects),
  };
}

function readFromStorage(): SettingsState | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeSettings(parsed);
  } catch {
    return null;
  }
}

function writeToStorage(settings: SettingsState) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota / private mode errors
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // First render uses DEFAULTS (SSR-safe), then hydrate from storage on mount.
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);

  useEffect(() => {
    setMounted(true);

    const fromStorage = readFromStorage();
    if (fromStorage) setSettings(fromStorage);
    else setSettings(DEFAULTS);
  }, []);

  /**
   * ✅ Listen to ThemeProvider -> SettingsProvider sync events
   * "denetron:set-theme" detail: ThemeMode
   * "denetron:set-accent" detail: AccentMode
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onTheme = (e: Event) => {
      const next = (e as CustomEvent).detail;
      if (isTheme(next)) {
        setSettings((prev) => ({ ...prev, theme: next }));
      }
    };

    const onAccent = (e: Event) => {
      const next = (e as CustomEvent).detail;
      if (isAccent(next)) {
        setSettings((prev) => ({ ...prev, accent: next }));
      }
    };

    window.addEventListener("denetron:set-theme", onTheme as any);
    window.addEventListener("denetron:set-accent", onAccent as any);

    return () => {
      window.removeEventListener("denetron:set-theme", onTheme as any);
      window.removeEventListener("denetron:set-accent", onAccent as any);
    };
  }, []);

  /**
   * ✅ Multi-tab sync (optional but pro)
   * If another tab changes settings, update this tab too.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = readFromStorage();
      if (next) setSettings(next);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /**
   * ✅ Persist + apply dataset variables
   * - Runs after hydration and also on any change
   */
  useEffect(() => {
    // Avoid writing during the very first SSR pass, but it's safe either way.
    writeToStorage(settings);

    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = settings.theme;
      document.documentElement.dataset.accent = settings.accent;
    }
  }, [settings]);

  const value = useMemo(
    () => ({ settings, setSettings, mounted }),
    [settings, mounted]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside <SettingsProvider />");
  }
  return ctx;
}
