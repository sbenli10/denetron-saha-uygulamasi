"use client";

import { SlidersHorizontal } from "lucide-react";

export default function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        inline-flex h-10 w-10 items-center justify-center
        rounded-xl border border-border
        bg-card/30 backdrop-blur
        hover:bg-accent/40 transition
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
      "
      aria-label="Ayarları aç"
      type="button"
    >
      <SlidersHorizontal size={18} className="text-foreground" />
    </button>
  );
}
