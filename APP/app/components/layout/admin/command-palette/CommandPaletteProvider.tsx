// APP/app/components/layout/admin/command-palette/CommandPaletteProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import CommandPalette from "./CommandPalette";
import { loadMemory } from "./ai/aiMemoryStore";
import { useDefaultCommands } from "./commands";

export type CommandItemType = {
  id: string;
  label: string;
  shortcut?: string;
  category?: "navigation" | "system" | "quick";
  loading?: boolean;
  action: () => Promise<void> | void;
};

type CommandPaletteContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;

  query: string;
  setQuery: (v: string) => void;

  activeCommand: CommandItemType | null;
  setActiveCommand: (c: CommandItemType | null) => void;

  confidence: number | null;
  setConfidence: (n: number | null) => void;

  ghost: string | null;
  setGhost: (t: string | null) => void;

  commands: CommandItemType[];
  registerCommands: (items: CommandItemType[]) => void;

  openSettings: () => void;
  openNotifications: () => void;
  logout: () => void;
};

const CommandPaletteContext =
  createContext<CommandPaletteContextType | null>(null);

export function CommandPaletteProvider({
  children,
  openSettings,
  openNotifications,
  logout,
}: {
  children: React.ReactNode;
  openSettings: () => void;
  openNotifications: () => void;
  logout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [commands, setCommands] = useState<CommandItemType[]>([]);

  const [query, setQuery] = useState("");
  const [activeCommand, setActiveCommand] =
    useState<CommandItemType | null>(null);

  const [confidence, setConfidence] = useState<number | null>(null);
  const [ghost, setGhost] = useState<string | null>(null);

  /* Command register function */
  const registerCommands = (items: CommandItemType[]) => {
    const mem = loadMemory();

    setCommands((prev) => {
      const newOnes = items.filter((i) => !prev.some((p) => p.id === i.id));
      const merged = [...prev, ...newOnes];

      merged.sort((a, b) => {
        const sA = mem.find((m) => m.id === a.id)?.score ?? 0;
        const sB = mem.find((m) => m.id === b.id)?.score ?? 0;
        return sB - sA;
      });

      return merged;
    });
  };

  /* Default komutları yükle */
  const defaultCommands = useDefaultCommands(
    openSettings,
    openNotifications,
    logout
  );

  useEffect(() => {
    registerCommands(defaultCommands);
  }, []);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = typeof e.key === "string" ? e.key.toLowerCase() : "";

      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }

      if (key === "escape") setOpen(false);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <CommandPaletteContext.Provider
      value={{
        open,
        setOpen,
        query,
        setQuery,
        activeCommand,
        setActiveCommand,
        confidence,
        setConfidence,
        ghost,
        setGhost,
        commands,
        registerCommands,
        openSettings,
        openNotifications,
        logout,
      }}
    >
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be inside provider");
  return ctx;
}
