"use client";

import { useEffect, useState } from "react";
import { AIMediaItem } from "../types";

export default function MediaSelector({
  onChange,
}: {
  onChange: (items: AIMediaItem[]) => void;
}) {
  const [media, setMedia] = useState<AIMediaItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    onChange(media.filter(m => selected.includes(m.url)));
  }, [selected, media, onChange]);

  function toggle(url: string) {
    setSelected(prev =>
      prev.includes(url)
        ? prev.filter(x => x !== url)
        : [...prev, url]
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-300">
          Analize Dahil Edilecek Medyalar
        </h2>

        {selected.length > 0 && (
          <span className="text-xs text-yellow-400">
            {selected.length} seçildi
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {media.map(m => {
          const isSelected = selected.includes(m.url);

          return (
            <button
              key={m.url}
              type="button"
              onClick={() => toggle(m.url)}
              aria-pressed={isSelected}
              className={`
                relative group rounded-xl overflow-hidden border
                transition
                focus:outline-none focus:ring-2 focus:ring-yellow-500/50
                ${isSelected
                  ? "border-yellow-500 ring-2 ring-yellow-500/40"
                  : "border-white/10 hover:border-white/30"}
              `}
            >
              <img
                src={m.url}
                alt="Analiz medyası"
                className="
                  h-28 w-full object-cover
                  transition-transform duration-200
                  group-hover:scale-[1.02]
                "
              />

              {isSelected && (
                <div className="absolute inset-0 bg-yellow-500/10" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
