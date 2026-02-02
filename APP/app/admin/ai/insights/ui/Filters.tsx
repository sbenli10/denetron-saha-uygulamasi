"use client";

import { useState } from "react";

export type FiltersState = {
  from: string | null;
  to: string | null;
  scope: "org" | "location" | "template";
  scoped: string | null;
  severity: "all" | "low" | "mid" | "high" | "critical";
  q: string;
};

export default function Filters({
  onApply,
  initialScope,
}: {
  onApply: (f: FiltersState) => void;
  initialScope: { type: "org" | "location" | "template"; id: string | null };
}) {
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [scope, setScope] = useState<FiltersState["scope"]>(
    initialScope?.type ?? "org"
  );
  const [scoped, setScoped] = useState<string | null>(initialScope?.id ?? null);
  const [severity, setSeverity] = useState<FiltersState["severity"]>("all");
  const [q, setQ] = useState("");

  const submit = () => {
    onApply({ from, to, scope, scoped, severity, q });
  };

  return (
    <div className="rounded-2xl border bg-white/80 p-3 shadow-glass dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-xs text-slate-500">Başlangıç</label>
          <input
            type="date"
            className="mt-1 h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
            onChange={(e) => setFrom(e.target.value || null)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-500">Bitiş</label>
          <input
            type="date"
            className="mt-1 h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
            onChange={(e) => setTo(e.target.value || null)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-500">Kapsam</label>
          <select
            className="mt-1 h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
            value={scope}
            onChange={(e) => setScope(e.target.value as FiltersState["scope"])}
          >
            <option value="org">Tüm Organizasyon</option>
            <option value="location">Lokasyon</option>
            <option value="template">Şablon</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-500">ID / Kod</label>
          <input
            className="mt-1 h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
            placeholder="Opsiyonel"
            value={scoped ?? ""}
            onChange={(e) => setScoped(e.target.value || null)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-500">Şiddet</label>
          <select
            className="mt-1 h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
            value={severity}
            onChange={(e) =>
              setSeverity(e.target.value as FiltersState["severity"])
            }
          >
            <option value="all">Tümü</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="mid">Mid</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex flex-1 flex-col min-w-[140px]">
          <label className="text-xs text-slate-500">Arama</label>
          <input
            className="mt-1 h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
            placeholder="Not / başlık ara…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={submit}
          className="h-9 rounded-xl bg-amber-500 px-4 text-xs font-semibold text-slate-900 hover:bg-amber-400"
        >
          Uygula
        </button>
      </div>
    </div>
  );
}
