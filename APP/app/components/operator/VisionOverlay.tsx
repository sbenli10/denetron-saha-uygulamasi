// APP/app/components/operator/VisionOverlay.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { Box } from "@/types/vision";

export interface LiveRisk {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  confidence?: number;

  // 🧠 AI farkındalık alanları
  awareness?: string;     // why_risk
  mitigation?: string;    // what_to_do
  consequence?: string;   // if_ignored

  box?: Box;
}


interface VisionOverlayProps {
  risks?: LiveRisk[];
  onSelect?: (risk: LiveRisk) => void;
  aiOffline?: boolean;
}

export default function VisionOverlay({
  risks = [],
  onSelect,
  aiOffline = false,
}: VisionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const [hoveredRisk, setHoveredRisk] = useState<LiveRisk | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<LiveRisk | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  if (risks.length === 0 && !aiOffline) return null;

  function normalizeConfidence(r: LiveRisk) {
    if (typeof r.confidence === "number") return r.confidence;
    if (r.severity === "high") return 0.85;
    if (r.severity === "medium") return 0.6;
    return 0.35;
  }

  const activeRisk = hoveredRisk ?? selectedRisk;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-40 pointer-events-none"
    >
      {risks.map(r => {
        if (!r.box) return null;
        const conf = normalizeConfidence(r);

        return (
          <div
            key={r.id}
            onClick={() => {
              setSelectedRisk(prev =>
                prev?.id === r.id ? null : r
              );
              onSelect?.(r);
            }}
            onMouseEnter={() => setHoveredRisk(r)}
            onMouseLeave={() => setHoveredRisk(null)}
            className={`
              absolute rounded-md pointer-events-auto
              ${conf > 0.8
                ? "border-2 border-red-500 animate-pulse"
                : conf > 0.55
                ? "border-2 border-amber-400"
                : "border border-emerald-500 opacity-70"}
            `}
            style={{
              left: r.box.x * size.w,
              top: r.box.y * size.h,
              width: r.box.w * size.w,
              height: r.box.h * size.h,
            }}
          />
        );
      })}

      {activeRisk && (
        <div className="
          absolute top-4 right-4 z-50 w-72
          bg-black/85 border border-white/10
          rounded-xl p-4 text-xs backdrop-blur
          pointer-events-auto
        ">
          <div className="font-semibold text-amber-400">
            {activeRisk.label}
          </div>

          <div className="mt-1 text-white/80">
            Güven seviyesi: %{Math.round(normalizeConfidence(activeRisk) * 100)}
          </div>

          {activeRisk.awareness && (
            <div className="mt-3 text-white/80">
              <b>Neden risk?</b><br />
              {activeRisk.awareness}
            </div>
          )}

          {activeRisk.mitigation && (
            <div className="mt-3 text-emerald-300/80">
              <b>Ne yapılabilir?</b><br />
              {activeRisk.mitigation}
            </div>
          )}

          {activeRisk.consequence && (
            <div className="mt-3 text-red-300/80">
              <b>Önlem alınmazsa:</b><br />
              {activeRisk.consequence}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
