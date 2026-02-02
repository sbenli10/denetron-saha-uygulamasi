"use client";

import { useState } from "react";

export default function RiskTemplateModal({
  template,
  onClose,
  onSaved,
}: any) {
  const [form, setForm] = useState(template);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);

    await fetch("/api/risk-templates/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          Risk Şablonu
        </h2>

        <input
          placeholder="Alan"
          className="w-full border rounded px-3 py-2"
          value={form.area}
          onChange={e => setForm({ ...form, area: e.target.value })}
        />

        <input
          placeholder="Ekipman"
          className="w-full border rounded px-3 py-2"
          value={form.equipment}
          onChange={e =>
            setForm({ ...form, equipment: e.target.value })
          }
        />

        <textarea
          placeholder="Risk Tanımı"
          className="w-full border rounded px-3 py-2"
          rows={3}
          value={form.risk_text}
          onChange={e =>
            setForm({ ...form, risk_text: e.target.value })
          }
        />

        <textarea
          placeholder="Önerilen Faaliyet"
          className="w-full border rounded px-3 py-2"
          rows={2}
          value={form.action_text}
          onChange={e =>
            setForm({ ...form, action_text: e.target.value })
          }
        />

        <select
          className="w-full border rounded px-3 py-2"
          value={form.default_severity}
          onChange={e =>
            setForm({
              ...form,
              default_severity: e.target.value,
            })
          }
        >
          <option value="low">Düşük</option>
          <option value="medium">Orta</option>
          <option value="high">Yüksek</option>
        </select>

        <div className="flex justify-end gap-3 pt-3">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            İptal
          </button>
          <button
            disabled={loading}
            onClick={save}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
