// APP/app/admin/tasks/schedules/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";


export default async function SchedulesPage() {
  const supabase = supabaseServerClient();

  // Artık task_schedules değil VIEW kullanıyoruz!
  const { data: schedules, error } = await supabase
    .from("v_task_schedules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Schedule fetch error:", error);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Planlı Görevler</h1>

        {/* Gerçek kayıt yapan sayfaya gider */}
        <Link
          href="/admin/tasks"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Yeni Plan Oluştur
        </Link>
      </div>

      <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-3 text-left">Şablon</th>
            <th className="p-3 text-left">Operatörler</th>
            <th className="p-3 text-left">Periyot</th>
            <th className="p-3 text-left">Sonraki Çalışma</th>
            <th className="p-3 text-left">Durum</th>
            <th className="p-3 text-right">Aksiyon</th>
          </tr>
        </thead>

        <tbody>
          {schedules?.map((s: any) => (
            <tr key={s.id} className="border-t">
              {/* ŞABLON ADI */}
              <td className="p-3">
                {s.template_name ?? "-"}
              </td>

              {/* OPERATÖRLER */}
              <td className="p-3">
                {s.operators?.length > 0
                  ? s.operators.map((op: any) => op.name).join(", ")
                  : "—"}
              </td>

              <td className="p-3">{s.frequency}</td>

              <td className="p-3">
                {new Date(s.next_run_at).toLocaleString("tr-TR")}
              </td>

              <td className="p-3">{s.status}</td>

              <td className="p-3 text-right">
                <Link
                  href={`/admin/tasks/schedules/${s.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Düzenle
                </Link>
              </td>
            </tr>
          ))}

          {(!schedules || schedules.length === 0) && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                Henüz planlı görev yok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
