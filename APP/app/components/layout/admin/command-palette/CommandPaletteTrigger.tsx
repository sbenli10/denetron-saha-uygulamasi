"use client";

import { useCommandPalette } from "./CommandPaletteProvider";
import { Command } from "lucide-react";

export default function CommandPaletteTrigger() {
  const { setOpen } = useCommandPalette();

  return (
    <button
      onClick={() => setOpen(true)}
      className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition"
    >
      <Command size={20} />
    </button>
  );
}
