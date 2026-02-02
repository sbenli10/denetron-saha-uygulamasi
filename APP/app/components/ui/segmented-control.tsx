"use client";

export default function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div
      className="
        inline-flex bg-white/60 backdrop-blur-xl border border-white/70
        rounded-xl shadow-inner shadow-[inset_0_0_10px_rgba(255,255,255,0.45)]
        p-1
      "
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              px-5 py-2 rounded-lg transition-all
              ${active
                ? "bg-white shadow text-black"
                : "text-black/50 hover:text-black"
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
