"use client";
export const dynamic = "force-dynamic";

import useSWR from "swr";
import { useState } from "react";

type WordTemplate = {
  id: string;
  name: string;
  version: string;
  file_path: string;
  is_active: boolean;
  created_at: string;
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DofWordTemplatesAdminPage() {
  const { data, mutate } = useSWR<{ templates: WordTemplate[] }>(
    "/api/admin/dof-word-templates",
    fetcher
  );

  const [uploading, setUploading] = useState(false);

  if (!data) {
    return <div className="p-10 text-gray-500">Yükleniyor…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          DÖF Word Şablonları
        </h1>

        <button
          className="px-4 py-2 rounded-lg bg-blue-600 text-white"
          onClick={() => alert("Yeni şablon yükleme modalı açılacak")}
        >
          + Yeni Şablon Yükle
        </button>
      </header>

      <div className="rounded-xl border bg-white divide-y">
        {data.templates.map(t => (
          <div
            key={t.id}
            className="p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">
                {t.name}
              </div>
              <div className="text-sm text-gray-500">
                Versiyon: {t.version}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(t.created_at).toLocaleDateString("tr-TR")}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {t.is_active ? (
                <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                  Aktif
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded bg-gray-100">
                  Pasif
                </span>
              )}

              <button
                className="text-sm border px-3 py-1 rounded"
                onClick={async () => {
                  await fetch("/api/admin/dof-word-templates/toggle", {
                    method: "POST",
                    body: JSON.stringify({ id: t.id }),
                  });
                  mutate();
                }}
              >
                Durum Değiştir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
