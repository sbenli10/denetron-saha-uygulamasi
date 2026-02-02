// APP/app/components/assign/TemplatePicker.tsx
"use client";

import { TemplateDTO } from "./types";
import { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";
import activeAnim from "@/app/lottie/active-glow.json";

interface Props {
  templates: TemplateDTO[];
  value: string;
  onChange: (id: string) => void;
}

export default function TemplatePicker({ templates, value, onChange }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const tiltRef = useRef<HTMLButtonElement | null>(null);

  function handleMove(e: any, id: string) {
    if (tiltRef.current && hovered === id) {
      const rect = tiltRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      tiltRef.current.style.transform = `
        perspective(900px)
        rotateX(${y / 25}deg)
        rotateY(${x / -25}deg)
        scale(1.03)
      `;
    }
  }

  function resetTilt() {
    if (tiltRef.current) {
      tiltRef.current.style.transform =
        "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 relative">
      {templates.map((t) => {
        const selected = value === t.id;
        const isHovered = hovered === t.id;

        return (
          <button
            key={t.id}
            ref={hovered === t.id ? tiltRef : null}
            type="button"
            onMouseEnter={() => setHovered(t.id)}
            onMouseLeave={() => {
              setHovered(null);
              resetTilt();
            }}
            onMouseMove={(e) => handleMove(e, t.id)}
            onClick={() => onChange(t.id)}
            className={`
              relative rounded-2xl p-6 text-left transition-all duration-300
              overflow-hidden
              backdrop-blur-2xl
              ${
                selected
                  ? "border-2 border-[#7C6DFE] bg-[#1A1C24]/80 shadow-[0_0_60px_rgba(124,109,254,0.45)]"
                  : "border border-white/10 bg-[#0D0F14]/60 hover:border-[#7C6DFE]/40 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
              }
            `}
          >
            {/* INNER GLOW SPOTLIGHT */}
            <div
              className={`
                absolute inset-0 rounded-2xl opacity-0 pointer-events-none
                transition-all duration-300
                ${
                  isHovered
                    ? "opacity-20 bg-gradient-to-br from-[#7C6DFE]/30 to-[#00C4B4]/25 blur-2xl"
                    : ""
                }
              `}
            />

            {/* LOTTIE ACTIVE ANIMATION */}
            {selected && (
              <div className="absolute inset-0 pointer-events-none opacity-80">
                <Lottie
                  animationData={activeAnim}
                  loop
                  autoplay
                  className="absolute inset-0"
                />
              </div>
            )}

            {/* CONTENT */}
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-white drop-shadow-md mb-2">
                {t.name}
              </h3>

              <p className="text-sm text-white/60 leading-relaxed">
                {t.description || "Açıklama bulunmuyor."}
              </p>
            </div>

            {/* NEON EDGE LIGHT */}
            <div
              className={`
                absolute inset-0 rounded-2xl pointer-events-none
                transition-all duration-300
                ${isHovered ? "shadow-[0_0_35px_rgba(124,109,254,0.5)]" : ""}
              `}
            />
          </button>
        );
      })}
    </div>
  );
}
