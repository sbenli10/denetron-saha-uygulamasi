"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  // Light modda efektleri zorla kapat
  const isLight = settings.theme === "light";

  // Local state yok; direkt Settings’ten türetiyoruz
  const effects: EffectsState = useMemo(() => {
    if (isLight) return { glow: false, grid: false, scanline: false };
    return settings.effects;
  }, [isLight, settings.effects]);

  // Dışarıdan (UI) toggle etmek istersek Settings’e yazar
  const setEffects = (next: EffectsState) => {
    setSettings({
      ...settings,
      effects: next,
    });
  };

  // Tema light’a geçince effects state’i de temiz kalsın (persist)
  useEffect(() => {
    if (isLight) {
      const anyOn =
        settings.effects.glow || settings.effects.grid || settings.effects.scanline;
      if (anyOn) {
        setSettings({
          ...settings,
          effects: { glow: false, grid: false, scanline: false },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLight]);

  return (
    <EffectsContext.Provider value={{ ...effects, setEffects }}>
      <div className="relative min-h-screen bg-background text-foreground">
        {/* Effects only when allowed */}
        {!isLight && effects.glow && <GlowEffect />}
        {!isLight && effects.grid && <GridEffect />}
        {!isLight && effects.scanline && <ScanlineEffect />}

        {children}
      </div>
    </EffectsContext.Provider>
  );
}

export function useEffects() {
  return useContext(EffectsContext);
}
