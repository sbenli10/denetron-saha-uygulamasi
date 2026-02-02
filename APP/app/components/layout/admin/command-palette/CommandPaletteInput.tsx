"use client";

import { useEffect, useRef } from "react";
import { useCommandPalette } from "./CommandPaletteProvider";
import { resolveGPTIntent } from "./ai/gptIntentEngine";
import { useCommandRouter } from "./CommandRouter";

/* ---------------------------------------------
   LOCAL RATE LIMIT HELPER
------------------------------------------------ */
function canCall(key: string, cooldownMs: number) {
  const now = Date.now();
  const store = (window as any).__rl ?? ((window as any).__rl = {});
  const last = store[key] ?? 0;

  if (now - last < cooldownMs) return false;

  store[key] = now;
  return true;
}

/* ---------------------------------------------
   DEBOUNCE
------------------------------------------------ */
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function CommandPaletteInput() {
  const {
    query,
    setQuery,
    ghost,
    setGhost,
    setOpen,
    commands,
    setActiveCommand,
    setConfidence,
    openSettings,
    openNotifications,
    logout,
  } = useCommandPalette();

  const { executeIntent } = useCommandRouter({
    openSettings,
    openNotifications,
    logout,
  });

  /* ============================================
     1) AUTOCOMPLETE (DEBOUNCE + RATE LIMIT)
  ============================================= */
  const ghostRunner = useRef(
    debounce(async (value: string) => {
      if (!value.trim()) return setGhost(null);
      if (!canCall("autocomplete", 300)) return;

      try {
        const res = await fetch("/api/ai/autocomplete", {
          method: "POST",
          body: JSON.stringify({ query: value }),
        });

        if (!res.ok) return;

        const { suggestion } = await res.json();

        if (!suggestion || suggestion.toLowerCase() === value.toLowerCase())
          return setGhost(null);

        setGhost(suggestion);
      } catch {}
    }, 350)
  ).current;

  useEffect(() => {
    ghostRunner(query);
  }, [query]);


  /* ============================================
     2) INTENT MATCHER (DEBOUNCE + RATE LIMIT)
  ============================================= */
  const intentRunner = useRef(
    debounce(async (value: string) => {
      if (!value.trim()) {
        setActiveCommand(null);
        setConfidence(null);
        return;
      }

      if (!canCall("intent", 800)) return;

      try {
        const { intent, confidence } = await resolveGPTIntent(value);
        setConfidence(confidence);

        if (confidence < 0.6) return setActiveCommand(null);

        const match = commands.find((c) =>
          c.id.toLowerCase().includes(intent.toLowerCase())
        );

        setActiveCommand(match ?? null);
      } catch {}
    }, 400)
  ).current;

  useEffect(() => {
    intentRunner(query);
  }, [query]);


  /* ============================================
     Ghost Accept
  ============================================= */
  const acceptGhost = () => {
    if (!ghost) return;
    setQuery(ghost);
    setGhost(null);
  };


  /* ============================================
     ENTER → Execute Command
  ============================================= */
  const executeAICommand = async () => {
    try {
      const { intent, confidence } = await resolveGPTIntent(query);
      if (confidence < 0.55) return;

      const match = commands.find((c) =>
        c.id.toLowerCase().includes(intent.toLowerCase())
      );

      if (match) {
        await match.action();
        return setOpen(false);
      }

      await executeIntent(intent);
      setOpen(false);
    } catch {}
  };


  /* ============================================
     UI
  ============================================= */
  return (
    <div className="relative border-b border-border p-3">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === "Enter") await executeAICommand();
          if (e.key === "Tab") {
            e.preventDefault();
            acceptGhost();
          }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Komut yazın…"
        className="w-full bg-transparent outline-none text-sm relative z-10"
      />

      {ghost && (
        <div className="absolute inset-0 text-foreground/25 pointer-events-none select-none p-3 text-sm">
          <span className="opacity-0">{query}</span>
          <span>{ghost.slice(query.length)}</span>
        </div>
      )}
    </div>
  );
}
