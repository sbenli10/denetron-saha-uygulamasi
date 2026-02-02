//APP\app\components\operator\TemplateForm.tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type TemplateField =
  | { type: "divider"; label?: string }
  | { type: "boolean"; key: string; label?: string; critical?: boolean }
  | { type: "text"; key: string; label?: string; placeholder?: string }
  | { type: "textarea"; key: string; label?: string; maxLength?: number }
  | {
      type: "select";
      key: string;
      label?: string;
      default?: string;
      options?: { label: string; value: string }[];
    };

type Template = {
  id: string;
  name: string;
  fields: TemplateField[] | null;
};

export default function TemplateForm({
  template,
  taskId,        // artık opsiyonel
  onSuccess,
}: {
  template: Template;
  taskId?: string;   // <-- DÜZELTİLDİ
  onSuccess?: () => void;
}) {
  
  const fields = Array.isArray(template.fields) ? template.fields : [];
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const setValue = (key: string, val: any) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setSubmitting(true);

    try {
      const body: any = {
        template_id: template.id,
        template_name: template.name,
        answers: values,
      };

      // Eğer taskId varsa API'ye ekle
      if (taskId) body.task_id = taskId;

      const res = await fetch("/api/operator/task-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const out = await res.json();

      if (!res.ok) {
        setError(out.error || "Gönderim sırasında hata oluştu.");
      } else {
        setOk(true);
        onSuccess?.();
        setValues({});
      }
    } catch (err: any) {
      setError(err.message ?? "Sunucu hatası.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">

      {fields.map((f, idx) => {
        if (f.type === "divider") {
          return (
            <div key={idx} className="pt-4 first:pt-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {f.label || "Bölüm"}
              </div>
              <div className="mt-1 h-px bg-gradient-to-r from-amber-500/40 via-slate-700 to-transparent" />
            </div>
          );
        }

        const key = (f as any).key;
        const val = values[key] ?? "";

        if (f.type === "boolean") {
          return (
            <label
              key={key}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2"
            >
              <span className="text-sm text-slate-50">
                {f.label || key}
                {f.critical && (
                  <span className="ml-1 text-red-400 text-xs">(Kritik)</span>
                )}
              </span>

              <input
                type="checkbox"
                checked={!!val}
                onChange={(e) => setValue(key, e.target.checked)}
                className="h-5 w-5 accent-amber-400"
              />
            </label>
          );
        }

        if (f.type === "text") {
          return (
            <div key={key} className="space-y-1">
              <label className="text-xs text-slate-400">{f.label || key}</label>
              <input
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 text-sm text-slate-50"
                value={val}
                onChange={(e) => setValue(key, e.target.value)}
                placeholder={f.placeholder || ""}
              />
            </div>
          );
        }

        if (f.type === "textarea") {
          return (
            <div key={key} className="space-y-1">
              <label className="text-xs text-slate-400">{f.label || key}</label>
              <textarea
                className="w-full rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-50"
                rows={4}
                value={val}
                onChange={(e) => setValue(key, e.target.value)}
              />
            </div>
          );
        }

        if (f.type === "select") {
          return (
            <div key={key} className="space-y-1">
              <label className="text-xs text-slate-400">{f.label || key}</label>
              <select
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 text-sm text-slate-50"
                value={val || f.default || ""}
                onChange={(e) => setValue(key, e.target.value)}
              >
                <option value="">Seçiniz</option>
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return null;
      })}

      {error && (
        <div className="text-xs text-red-400 border border-red-500/40 rounded-xl px-3 py-2 bg-red-950/20">
          {error}
        </div>
      )}

      {ok && (
        <div className="text-xs text-emerald-400 border border-emerald-500/40 rounded-xl px-3 py-2 bg-emerald-950/20">
          Görev başarıyla gönderildi.
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="
          fixed bottom-16 left-0 right-0 mx-4 
          h-11 rounded-xl 
          text-sm font-semibold 
          bg-amber-500 text-slate-950 
          shadow-lg disabled:opacity-60
        "
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Gönderiliyor…
          </span>
        ) : (
          "Gönderimi Tamamla"
        )}
      </button>

    </form>
  );
}
