"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp } from "lucide-react";

const sortOptions = [
  { label: "Tarihe göre", value: "completed_at" },
  { label: "Operatöre göre", value: "operator_name" },
  { label: "Şablona göre", value: "template_name" }
];

export default function SortBar() {
  const router = useRouter();
  const params = useSearchParams();

  const current = params.get("sort") ?? "completed_at";
  const direction = params.get("dir") ?? "desc";

  function setSort(value: string) {
    const newParams = new URLSearchParams(params.toString());
    newParams.set("sort", value);
    newParams.set("page", "1");
    router.push(`?${newParams.toString()}`);
  }

  function toggleDir() {
    const newParams = new URLSearchParams(params.toString());
    newParams.set("dir", direction === "asc" ? "desc" : "asc");
    router.push(`?${newParams.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={current}
        onChange={(e) => setSort(e.target.value)}
        className="px-3 py-2 rounded-xl bg-white/40 backdrop-blur-xl ring-1 ring-black/10 text-sm text-[#2C2F3A]"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        onClick={toggleDir}
        className="p-2 rounded-xl bg-white/40 backdrop-blur-xl ring-1 ring-black/10 hover:bg-white/70 transition"
      >
        <ArrowDownUp className="w-4 h-4 text-[#3A3F58]" />
      </button>
    </div>
  );
}
