"use client";

import useSWR from "swr";
import { useState } from "react";
import RiskTemplateModal from "@/app/components/risk-templates/RiskTemplateModal";
type RiskTemplate = {
  id: string;
  area: string;
  equipment: string;
  risk_text: string;
  action_text: string;
  legislation: string | null;
  default_severity: "low" | "medium" | "high";
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RiskTemplatesAdminPage() {
  const { data, mutate } = useSWR("/api/risk-templates", fetcher);
  const [editing, setEditing] = useState<RiskTemplate | null>(null);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          Risk Şablonları Yönetimi
        </h1>

        <button
          onClick={() =>
            setEditing({
              id: "",
              area: "",
              equipment: "",
              risk_text: "",
              action_text: "",
              legislation: "",
              default_severity: "medium",
            })
          }
          className="px-4 py-2 rounded-lg bg-blue-600 text-white"
        >
          + Yeni Şablon
        </button>
      </header>

      <div className="grid gap-4">
        {(data?.templates ?? []).map((t: RiskTemplate) => (
          <div
            key={t.id}
            className="rounded-xl border bg-white p-5 space-y-2"
          >
            <div className="font-semibold">
              {t.area} – {t.equipment}
            </div>

            <p className="text-sm">
              <b>Risk:</b> {t.risk_text}
            </p>

            <p className="text-sm">
              <b>Faaliyet:</b> {t.action_text}
            </p>

            <div className="text-xs text-gray-500">
              Önem: {t.default_severity.toUpperCase()}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditing(t)}
                className="px-3 py-1 text-sm border rounded-lg"
              >
                Düzenle
              </button>

              <button
                onClick={async () => {
                  await fetch(`/api/risk-templates/delete?id=${t.id}`, {
                    method: "DELETE",
                  });
                  mutate();
                }}
                className="px-3 py-1 text-sm border rounded-lg text-red-600"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <RiskTemplateModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            mutate();
          }}
        />
      )}
    </div>
  );
}
