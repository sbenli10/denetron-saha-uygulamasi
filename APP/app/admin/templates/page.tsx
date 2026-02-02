// APP/app/admin/templates/page.tsx

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getAdminContext } from "@/lib/admin/context";
import { listTemplates } from "./actions";
import TemplateToolbar from "./TemplateToolbar";
import TemplateCard from "./TemplateCard";

export default async function TemplatesPage() {
  const { user, profile, member, org } = await getAdminContext();
  const rows = await listTemplates();

  const panelBase =
    "rounded-2xl bg-white/70 border border-black/10 backdrop-blur-xl " +
    "shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all";

  return (
    <div className="relative min-h-screen">

      {/* SUBTLE BACKGROUND GLOWS */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute w-[600px] h-[600px] -top-40 -left-32 bg-blue-400/20 blur-[160px] rounded-full" />
        <div className="absolute w-[500px] h-[500px] bottom-[-160px] right-[-120px] bg-emerald-400/20 blur-[180px] rounded-full" />
      </div>

      <div className="space-y-10 relative px-6 py-8">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">
            Görev Şablonları
          </h1>

          <p className="text-sm text-black/60 mt-2 max-w-2xl">
            Saha görevleriniz için tekrar kullanılabilir, yapılandırılabilir şablonları yönetin.
          </p>
        </div>

        {/* TOOLBAR */}
        <div className={`${panelBase} p-5`}>
          <TemplateToolbar />
        </div>

        {/* TEMPLATE LIST */}
        <div className="mt-2">
          {rows.length === 0 ? (
            <div className={`${panelBase} p-14 text-center`}>
              <p className="text-black/60 text-base">
                Henüz şablon bulunmuyor.
                <br />
                <span className="font-medium text-black">
                  Yeni Şablon
                </span>{" "}
                oluşturarak başlayabilirsiniz.
              </p>
            </div>
          ) : (
            <div
              className="
                grid gap-6
                sm:grid-cols-2
                xl:grid-cols-3
                2xl:grid-cols-4
              "
            >
              {rows.map((t) => (
                <div
                  key={t.id}
                  className="
                    transition
                    hover:-translate-y-1
                    hover:shadow-[0_12px_35px_rgba(0,0,0,0.12)]
                  "
                >
                  <TemplateCard t={t} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
