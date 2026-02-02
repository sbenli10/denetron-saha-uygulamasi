"use client";

import { useCommandPalette } from "./CommandPaletteProvider";

export default function CommandItem({
  cmd,
  active,
}: {
  cmd: { id: string; label: string; shortcut?: string; action: () => void };
  active: boolean;
}) {
  const { setOpen } = useCommandPalette();

  return (
    <button
      onClick={() => {
        cmd.action();
        setOpen(false);
      }}
      className={`
        w-full flex items-center justify-between px-3 py-2 text-sm
        transition
        ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}
      `}
    >
      <span>{cmd.label}</span>

      {cmd.shortcut && (
        <span className="text-xs opacity-70">{cmd.shortcut}</span>
      )}
    </button>
  );
}
