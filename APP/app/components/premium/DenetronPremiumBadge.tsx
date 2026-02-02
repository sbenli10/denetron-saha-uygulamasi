"use client";

import { Crown } from "lucide-react";

export default function DenetronPremiumBadge() {
  return (
    <div className="relative">
      {/* PULSE AURA */}
      <div
        className="
          absolute inset-0 
          rounded-xl
          pointer-events-none
          z-0
        "
        style={{
          background:
            "radial-gradient(circle, rgba(255,223,128,0.35), rgba(255,215,0,0.08), transparent)",
          animation: "pulseAura 3.2s ease-in-out infinite",
          filter: "blur(8px)",
        }}
      />

      {/* BADGE ITSELF */}
      <div
        className="
          relative z-10
          inline-flex items-center gap-2
          px-4 py-1.5 
          rounded-xl select-none
          font-semibold text-xs tracking-wide
          text-black
          shadow-[0_4px_14px_rgba(215,167,45,0.45)]
          border border-[#F8E9A1]/80
          backdrop-blur-md
        "
        style={{
          background: `
            linear-gradient(
              120deg,
              #D4AF37,
              #EBCB71,
              #F8E6A0,
              #D4AF37,
              #C9A135
            )
          `,
          backgroundSize: "300% 300%",
          animation: "goldFlow 6s ease-in-out infinite",
        }}
      >
        {/* Internal shimmer */}
        <div
          className="
            absolute inset-0 
            pointer-events-none opacity-40
          "
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), transparent 60%)",
            animation: "goldShimmer 4s infinite ease-in-out",
          }}
        />

        <Crown
          size={16}
          className="relative z-10 text-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
        />

        <span className="relative z-10 text-[11px] uppercase font-extrabold">
          Premium
        </span>
      </div>
    </div>
  );
}
