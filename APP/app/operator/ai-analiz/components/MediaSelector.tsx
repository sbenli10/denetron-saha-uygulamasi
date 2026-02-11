// APP/app/operator/ai-analiz/components/MediaSelector.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";
import { AIMediaItem } from "../types";
import { cn } from "@/app/components/ui/cn";

export default function MediaSelector({ onChange }: { onChange: (items: AIMediaItem[]) => void }) {
  const [media] = useState<AIMediaItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    onChange(media.filter((m) => selected.includes(m.url)));
  }, [selected, media, onChange]);

  function toggle(url: string) {
    setSelected((prev) => (prev.includes(url) ? prev.filter((x) => x !== url) : [...prev, url]));
  }

  const selectedCount = selected.length;

  const empty = useMemo(() => media.length === 0, [media.length]);

  if (empty) {
    return (
      <div className="rounded-[var(--op-radius-2xl)] border border-[color:var(--op-border)] bg-white/5 p-6 text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl border border-[color:var(--op-border)] bg-black/15 flex items-center justify-center">
          <ImageIcon className="h-6 w-6 text-[color:var(--op-muted)]" />
        </div>
        <div className="mt-3 text-[13px] font-semibold text-[color:var(--op-text)]">Henüz medya yok</div>
        <div className="mt-1 text-[12px] text-[color:var(--op-muted)]">
          Bu bölüm v2 görüntü analizi için hazır. Medya eklendiğinde burada görünecek.
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-[color:var(--op-muted)]">
          Seçim yaparak analiz kapsamını belirleyin.
        </div>

        {selectedCount > 0 ? (
          <div className="text-[12px] font-semibold text-[color:var(--op-warning)]">{selectedCount} seçildi</div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {media.map((m) => {
          const isSelected = selected.includes(m.url);

          return (
            <button
              key={m.url}
              type="button"
              onClick={() => toggle(m.url)}
              aria-pressed={isSelected}
              className={cn(
                "relative overflow-hidden rounded-[18px] border transition active:scale-[0.99]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--op-ring)]",
                isSelected
                  ? "border-[color:color-mix(in_oklab,var(--op-warning)_55%,transparent)] bg-[color:color-mix(in_oklab,var(--op-warning)_10%,transparent)]"
                  : "border-[color:var(--op-border)] bg-[color:var(--op-surface-1)] hover:bg-white/5"
              )}
            >
              <img src={m.url} alt="Analiz medyası" className="h-28 w-full object-cover" />
              {isSelected ? <div className="absolute inset-0 bg-[color:color-mix(in_oklab,var(--op-warning)_12%,transparent)]" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
