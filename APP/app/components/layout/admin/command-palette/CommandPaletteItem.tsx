"use client";

export default function CommandPaletteItem({
  label,
  onSelect,
}: {
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="
        w-full text-left px-3 py-2 text-sm rounded-lg
        hover:bg-accent hover:text-accent-foreground
        transition
      "
    >
      {label}
    </button>
  );
}
