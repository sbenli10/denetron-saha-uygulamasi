//APP\app\admin\dof\manual\page.tsx
"use client";
export const dynamic = "force-dynamic";

import useSWR from "swr";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { mutate } from "swr";


/* ================= FETCHER ================= */

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch error");
  return res.json();
};

/* ================= CONST ================= */

const PAGE_SIZE = 10;

/* ================= PAGE ================= */

export default function ManualDofListPage() {
  const [page, setPage] = useState(1);

  const { data, error, isLoading } = useSWR(
    `/api/dof/manual/list?page=${page}&pageSize=${PAGE_SIZE}`,
    fetcher,
    { keepPreviousData: true }
  );

  const dofs = data?.dofs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  /* ================= STATES ================= */

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-sm text-gray-500">
        Yükleniyor…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-sm text-red-600">
        Veriler yüklenirken hata oluştu.
      </div>
    );
  }

  /* ================= RENDER ================= */

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-6">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Manuel DÖF’ler
          </h1>
          <p className="text-sm text-gray-600">
            Organizasyon bazlı manuel düzeltici / önleyici faaliyet kayıtları
          </p>
        </div>

        <Link
          href="/admin/dof/manual/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
        >
          <FileText size={16} />
          Yeni DÖF
        </Link>
      </div>

      {/* ================= TABLE ================= */}
      <div className="rounded-xl border bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-600">
              <th className="px-6 py-3 text-left">DÖF No</th>
              <th className="px-6 py-3 text-left">Açıklama</th>
              <th className="px-6 py-3 text-left">Durum</th>
              <th className="px-6 py-3 text-right">Tarih</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>

          <tbody>
            {dofs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-16 text-center text-sm text-gray-500"
                >
                  Henüz manuel DÖF kaydı bulunmuyor.
                </td>
              </tr>
            )}

            {dofs.map((d: any) => (
              <tr
                key={d.id}
                className="border-b last:border-b-0 hover:bg-gray-50 transition"
              >
                {/* DÖF NO */}
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  <Link
                    href={`/admin/dof/manual/${d.id}`}
                    className="hover:text-blue-600"
                  >
                    {d.report_no}
                  </Link>
                </td>

                {/* DESCRIPTION */}
                <td className="px-6 py-4 text-sm text-gray-600 max-w-[480px]">
                  <div className="line-clamp-2">
                    {d.description ?? "—"}
                  </div>
                </td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  {d.status === "closed" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 size={14} />
                      Kapalı
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      Açık
                    </span>
                  )}
                </td>

                {/* DATE */}
                <td className="px-6 py-4 text-right text-sm text-gray-500">
                  {new Date(d.created_at).toLocaleDateString("tr-TR")}
                </td>

                {/* ACTION */}
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-4">
                    {/* DETAY */}
                    <Link
                      href={`/admin/dof/manual/${d.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink size={14} />
                      Detay
                    </Link>

                    {/* DELETE */}
                    <button
                      onClick={async () => {
                        const ok = window.confirm(
                          "Bu DÖF kalıcı olarak silinecektir.\nBu işlem geri alınamaz.\n\nDevam etmek istiyor musunuz?"
                        );
                        if (!ok) return;

                        const res = await fetch(
                          "/api/dof/manual/delete",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ dof_id: d.id }),
                          }
                        );

                        const result = await res.json();

                        if (!res.ok) {
                          window.alert(result.error ?? "Silme işlemi başarısız");
                          return;
                        }

                        // 🔄 Listeyi yenile (reload yok)
                        mutate(
                          `/api/dof/manual/list?page=${page}&pageSize=${PAGE_SIZE}`
                        );
                      }}
                      className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                      Sil
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

      {/* ================= FOOTER / PAGINATION ================= */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-3 text-sm">
            {/* LEFT INFO */}
            <div className="text-gray-600">
              Toplam <strong>{total}</strong> kayıt ·{" "}
              <span>
                Sayfa <strong>{page}</strong> / {totalPages}
              </span>
            </div>

            {/* RIGHT CONTROLS */}
            <div className="flex items-center gap-1">
              {/* FIRST */}
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="rounded-md border px-2 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                title="İlk sayfa"
              >
                «
              </button>

              {/* PREVIOUS */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border px-2 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                title="Önceki sayfa"
              >
                ‹
              </button>

              {/* NEXT */}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border px-2 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                title="Sonraki sayfa"
              >
                ›
              </button>

              {/* LAST */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="rounded-md border px-2 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                title="Son sayfa"
              >
                »
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
