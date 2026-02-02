export const dynamic = "force-dynamic"; // her zaman güncel veri

import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import SearchBar from "./SearchBar";
import SortBar from "./SortBar";
import FilterBar from "./FilterBar";
import Pagination from "./Pagination";
import Link from "next/link";

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Record<string, string | undefined>;
}

interface TaskRow {
  task_id: string;                 // ✅ UNIQUE – React key için
  submission_id: string | null;    // ✅ NULL olabilir
  operator_name: string | null;
  operator_email: string | null;
  template_name: string | null;
  severity: string | null;
  completed_at: string | null;
  answers: any[] | null;
}

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
  const { org } = await getAdminContext();
  const db = supabaseServiceRoleClient();

  const page = Number(searchParams.page ?? 1);
  const query = searchParams.query ?? "";
  const severity = searchParams.severity ?? "";
  const sortField = searchParams.sort ?? "completed_at";
  const sortDir = searchParams.dir === "asc" ? "asc" : "desc";

  const offset = (page - 1) * PAGE_SIZE;

  let q = db
    .from("v_assigned_tasks_detailed")
    .select("*", { count: "exact" })
    .eq("org_id", org.id)
    .eq("status", "completed");

  if (query) {
    q = q.or(
      `operator_name.ilike.%${query}%,operator_email.ilike.%${query}%,template_name.ilike.%${query}%`
    );
  }

  if (severity) {
    q = q.eq("severity", severity);
  }

  q = q.order(sortField, { ascending: sortDir === "asc" });

  const { data: tasks, count } = await q.range(
    offset,
    offset + PAGE_SIZE - 1
  );

  function startResize(e: React.MouseEvent, index: number) {
  const startX = e.clientX;
  const th = (e.target as HTMLElement).parentElement!;
  const startWidth = th.offsetWidth;

  function onMove(ev: MouseEvent) {
    th.style.width = `${startWidth + (ev.clientX - startX)}px`;
  }

  function onUp() {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}
  return (
  <div className="space-y-8">
    {/* PAGE HEADER */}
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Tamamlanan Denetimler
        </h1>
        <p className="text-sm text-slate-500">
          Operatörler tarafından tamamlanan tüm denetimler.
        </p>
      </div>
    </div>

    {/* FILTER BAR */}
    <div className="
      flex flex-wrap items-center gap-3
      rounded-2xl border border-slate-200
      bg-white/80 backdrop-blur
      px-4 py-3
      shadow-sm
    ">
      <SearchBar />
      <FilterBar />
      <SortBar />
    </div>

    {/* TABLE CARD */}
    <div className="
      rounded-2xl
      border border-slate-200
      bg-white
      shadow-sm
      overflow-hidden
    ">
      <TableView tasks={tasks as TaskRow[]} />
    </div>

    {/* PAGINATION */}
    <div className="flex justify-end">
      <Pagination
        page={page}
        total={count ?? 0}
        pageSize={PAGE_SIZE}
        searchParams={searchParams}
      />
    </div>
  </div>
);

}

/* ------------------------------------------------
   TABLE VIEW
------------------------------------------------ */
function TableView({ tasks }: { tasks: TaskRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200 text-slate-600">
            <th className="px-6 py-4 text-left font-medium">Tamamlanma</th>
            <th className="px-6 py-4 text-left font-medium">Operatör</th>
            <th className="px-6 py-4 text-left font-medium">Şablon</th>
            <th className="px-6 py-4 text-left font-medium">Cevap Sayısı</th>
            <th className="px-6 py-4 text-left font-medium">Şiddet</th>
            <th className="px-6 py-4 text-right"></th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {tasks?.map((t) => {
            const operator =
              t.operator_name ||
              t.operator_email ||
              "Bilinmeyen Operatör";

            return (
              <tr
                key={t.task_id}
                className="
                  hover:bg-slate-50
                  transition
                "
              >
                <td className="px-6 py-4 text-slate-700">
                  {t.completed_at
                    ? new Date(t.completed_at).toLocaleString("tr-TR")
                    : (
                      <span className="italic text-slate-400">
                        Gönderilmedi
                      </span>
                    )}
                </td>

                <td className="px-6 py-4 text-slate-800 font-medium">
                  {operator}
                </td>

                <td className="px-6 py-4 text-slate-700">
                  {t.template_name ?? "-"}
                </td>

                <td className="px-6 py-4 text-slate-700">
                  {t.answers && t.answers.length > 0
                    ? `${t.answers.length} soru`
                    : (
                      <span className="italic text-slate-400">
                        Cevap yok
                      </span>
                    )}
                </td>

                <td className="px-6 py-4">
                  {t.severity ? (
                    <span className="
                      inline-flex items-center
                      rounded-full
                      bg-emerald-50
                      px-2.5 py-1
                      text-xs font-medium
                      text-emerald-700
                    ">
                      {t.severity}
                    </span>
                  ) : (
                    <span className="italic text-slate-400">
                      Hesaplanmadı
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  {t.submission_id ? (
                    <Link
                      href={`/admin/submissions/${t.submission_id}`}
                      className="
                        inline-flex items-center
                        rounded-lg
                        border border-slate-200
                        bg-white
                        px-3 py-1.5
                        text-sm
                        text-slate-700
                        shadow-sm
                        hover:bg-slate-50
                        transition
                      "
                    >
                      Detay
                    </Link>
                  ) : (
                    <span className="italic text-slate-400 text-sm">
                      Gönderilmedi
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {!tasks?.length && (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-10 text-center text-slate-500"
              >
                Hiç sonuç bulunamadı.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
