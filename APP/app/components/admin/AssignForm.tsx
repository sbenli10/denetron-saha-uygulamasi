//APP\app\components\admin\AssignForm.tsx
"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

/* -------------------- TYPES -------------------- */
export type TemplateDTO = {
  id: string;
  name: string;
};

export type OperatorDTO = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  templates: TemplateDTO[];
  operators: OperatorDTO[];
  action: (formData: FormData) => Promise<void>;
};

/* ------------------------------------------------ */

export default function AssignForm({
  templates,
  operators,
  action,
}: Props) {
  const [pending, setPending] = useState<boolean>(false);
  const [suggesting, setSuggesting] = useState<boolean>(false);

  const [suggested, setSuggested] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [operator, setOperator] = useState<string>("");

  /* ---------------- AI SUGGEST ---------------- */
  async function runAISuggestion() {
    if (!operator) {
      setError("Önce operatör seçin.");
      return;
    }

    setSuggesting(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/suggest-template", {
        method: "POST",
        body: JSON.stringify({
          operator_id: operator,
          org_id: "AUTO",
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setSuggested(json.template_id);
      setConfidence(json.confidence);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI hata oluştu.";
      setError(msg);
    }

    setSuggesting(false);
  }

  /* ---------------- RENDER FORM ---------------- */
  return (
    <form
      className="relative max-w-3xl space-y-8 p-8 rounded-2xl backdrop-blur-xl bg-slate-900/40 border border-amber-500/30 shadow-[0_0_45px_rgba(255,180,50,0.12)]"
      action={async (formData) => {
        setPending(true);
        setMessage(null);
        setError(null);

        try {
          await action(formData);
          setMessage("Görev başarıyla oluşturuldu.");
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Görev oluşturulamadı.";
          setError(msg);
        }

        setPending(false);
      }}
    >
      <h2 className="text-2xl font-bold text-amber-300 tracking-wide">
        Görev Atama
      </h2>

      {/* OPERATOR SELECT */}
      <div className="space-y-2">
        <label className="text-sm text-amber-200">Operatör</label>

        <select
          name="operator_id"
          required
          value={operator}
          onChange={(e) => {
            setOperator(e.target.value);
            setSuggested(null);
            setConfidence(0);
          }}
          className="w-full rounded-lg px-4 py-2.5 bg-slate-900/70 border border-slate-700 text-slate-200"
        >
          <option value="">Operatör seçin</option>
          {operators.map((o: OperatorDTO) => (
            <option key={o.id} value={o.id}>
              {o.name ?? o.email} ({o.email})
            </option>
          ))}
        </select>

        {/* AI BUTTON */}
        <button
          type="button"
          onClick={runAISuggestion}
          disabled={suggesting}
          className="flex items-center gap-2 text-amber-300 mt-2 hover:text-amber-200"
        >
          {suggesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          AI Şablon Öner
        </button>
      </div>

      {/* TEMPLATE SELECT */}
      <div className="space-y-2">
        <label className="text-sm text-amber-200">Şablon</label>

        {suggested && (
          <div className="p-3 border border-amber-500/40 rounded-lg bg-amber-500/10">
            <div className="font-medium text-amber-300">
              Önerilen Şablon:{" "}
              {templates.find((t) => t.id === suggested)?.name ?? "—"}
            </div>

            {/* CONFIDENCE BAR */}
            <div className="w-full h-2 bg-slate-700 rounded mt-2">
              <div
                className="h-2 bg-amber-400 rounded"
                style={{ width: `${confidence * 100}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.querySelector(
                  "select[name='template_id']"
                ) as HTMLSelectElement | null;

                if (el) el.value = suggested;
              }}
              className="mt-2 px-3 py-1.5 bg-amber-400 text-black rounded hover:bg-amber-300"
            >
              Bu öneriyi kullan
            </button>
          </div>
        )}

        <select
          name="template_id"
          required
          className="w-full rounded-lg px-4 py-2.5 bg-slate-900/70 border border-slate-700 text-slate-200"
        >
          <option value="">Şablon seçin</option>
          {templates.map((t: TemplateDTO) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* DATE */}
      <div className="space-y-2">
        <label className="text-sm text-amber-200">Son Tarih</label>
        <input
          type="date"
          name="due_date"
          className="w-full rounded-lg px-4 py-2.5 bg-slate-900/70 border border-slate-700 text-slate-200"
        />
      </div>

      {/* NOTE */}
      <div className="space-y-2">
        <label className="text-sm text-amber-200">Not</label>
        <textarea
          name="note"
          rows={3}
          className="w-full rounded-lg px-4 py-2.5 bg-slate-900/70 border border-slate-700 text-slate-200"
        ></textarea>
      </div>

      {/* MESSAGES */}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {message && <p className="text-xs text-emerald-400">{message}</p>}

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={pending}
        className="px-6 py-2.5 bg-amber-500 text-black rounded-lg hover:bg-amber-400"
      >
        {pending && (
          <Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />
        )}
        Görev Oluştur
      </button>
    </form>
  );
}
