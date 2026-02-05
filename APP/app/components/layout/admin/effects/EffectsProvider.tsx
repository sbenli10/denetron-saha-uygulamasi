"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import GlowEffect from "./GlowEffect";
import GridEffect from "./GridEffect";
import ScanlineEffect from "./ScanlineEffect";
import { useSettings } from "../settings/useSettings";

type EffectsState = {
  glow: boolean;
  grid: boolean;
  scanline: boolean;
};

type EffectsContextType = EffectsState & {
  setEffects: (next: EffectsState) => void;
};

const EffectsContext = createContext<EffectsContextType>({
  glow: false,
  grid: false,
  scanline: false,
  setEffects: () => {},
});

export function EffectsProvider({ children }: { children: React.ReactNode }) {
  const { settings, setSettings } = useSettings();

  const isLight = settings.theme === "light";

  /**
   * 🔒 Final effective state
   * - Light mode → always OFF
   * - Dark mode → from settings
   */
  const effects = useMemo<EffectsState>(() => {
    if (isLight) {
      return { glow: false, grid: false, scanline: false };
    }
    return settings.effects;
  }, [isLight, settings.effects]);

  /**
   * External toggle support (Settings UI)
   */
  const setEffects = (next: EffectsState) => {
    setSettings({
      ...settings,
      effects: next,
    });
  };

  /**
   * ⚠️ Safety net:
   * If user switches to light theme,
   * persistently disable all effects
   */
  useEffect(() => {
    if (isLight) {
      const anyOn =
        settings.effects.glow ||
        settings.effects.grid ||
        settings.effects.scanline;

      if (anyOn) {
        setSettings({
          ...settings,
          effects: { glow: false, grid: false, scanline: false },
        });
      }
    }
    // intentionally omit settings from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLight]);

  return (
    <EffectsContext.Provider value={{ ...effects, setEffects }}>
      {/* Root wrapper */}
      <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
        {/* ===== VISUAL EFFECT LAYER ===== */}
        {!isLight && (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0"
          >
            {effects.glow && <GlowEffect />}
            {effects.grid && <GridEffect />}
            {effects.scanline && <ScanlineEffect />}
          </div>
        )}

        {/* ===== APP CONTENT ===== */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </EffectsContext.Provider>
  );
}

export function useEffects() {
  return useContext(EffectsContext);
}
