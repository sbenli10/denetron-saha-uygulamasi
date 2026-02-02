"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CommandItem from "./CommandItem";
import { useCommandPalette } from "./CommandPaletteProvider";

import {
  detectUnknownCommand,
  createSmartCommand,
} from "./ai/smartActionEngine";

export default function CommandList() {
  const router = useRouter();
  const {
    commands,
    query,
    activeCommand,
    confidence,
    setOpen,
  } = useCommandPalette();

  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const unknown = detectUnknownCommand(query, commands);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      }

      if (e.key === "Enter") {
        filtered[activeIndex]?.action();
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, activeIndex]);

  return (
    <div className="max-h-64 overflow-y-auto">

      {/* === AI Confidence Bar === */}
      {confidence !== null && (
        <div className="px-3 py-2 border-b border-border bg-accent/10">
          <div className="text-[10px] uppercase opacity-50">
            GPT güven seviyesi: {Math.round(confidence * 100)}%
          </div>

          <div className="w-full h-1.5 mt-1 rounded bg-border overflow-hidden">
            <div
              className="h-full transition-all"
              style={{
                width: `${confidence * 100}%`,
                background:
                  confidence < 0.4
                    ? "#ef4444"
                    : confidence < 0.7
                    ? "#f97316"
                    : "#22c55e",
              }}
            />
          </div>
        </div>
      )}

      {/* === AI ÖNERİSİ === */}
      {activeCommand && query.length > 0 && (
        <div className="px-3 py-2 bg-accent/20 border-b border-border">
          <div className="text-xs opacity-60">AI Önerisi:</div>
          <div className="text-sm font-medium text-primary">
            {activeCommand.label}
          </div>
        </div>
      )}

      {/* === FİLTRELENMİŞ KOMUTLAR === */}
      {filtered.map((cmd, index) => (
        <CommandItem
          key={cmd.id}
          cmd={cmd}
          active={index === activeIndex}
        />
      ))}

      {filtered.length === 0 && query.length > 0 && (
        <div className="p-4 text-sm opacity-60">Komut bulunamadı…</div>
      )}

      {/* === AI Smart Action (Yeni komut oluştur) === */}
      {unknown && query.length > 0 && (
        <div className="p-3 mt-2 border-t border-border">
          <div className="text-xs opacity-70 mb-1">
            Bu komut mevcut değil:
          </div>

          <div className="font-medium text-primary">“{query}”</div>

          <button
            onClick={() => {
              createSmartCommand(query, router);
              setOpen(false);
            }}
            className="
              mt-2 px-3 py-2 text-xs rounded 
              bg-primary text-primary-foreground
              hover:bg-primary/80 transition
            "
          >
            Bu komutu oluştur
          </button>
        </div>
      )}
    </div>
  );
}
