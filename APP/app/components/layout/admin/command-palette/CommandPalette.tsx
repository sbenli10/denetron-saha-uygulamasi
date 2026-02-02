"use client";

import { useCommandPalette } from "./CommandPaletteProvider";
import CommandPaletteInput from "./CommandPaletteInput";
import CommandList from "./CommandList";

export default function CommandPalette() {
  const { open } = useCommandPalette();

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-[9999]
        bg-black/40 backdrop-blur-sm
        flex items-start justify-center
        pt-32
        animate-in fade-in duration-150
      "
    >
      <div
        className="
          w-full max-w-lg bg-card border border-border
          rounded-xl shadow-2xl overflow-hidden
          animate-in zoom-in duration-150
        "
      >
        <CommandPaletteInput />
        <CommandList />
      </div>
    </div>
  );
}
