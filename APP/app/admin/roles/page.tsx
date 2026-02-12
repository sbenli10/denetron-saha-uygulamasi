// APP/app/admin/roles/page.tsx
export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/admin/context";
import PremiumRequired from "@/app/admin/_components/PremiumRequired";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

import { CreateRoleModal } from "./CreateRoleModal";
import { EditRoleModal } from "./[id]/EditRoleModal";
import DeleteRoleDialog from "./DeleteRoleDialog";

export default async function AdminRolesPage() {
  const { member, org } = await getAdminContext();
  const admin = supabaseServiceRoleClient();

  const { data: roles } = await admin
    .from("roles")
    .select("id, name, permissions, created_at")
    .eq("org_id", member.org_id)
    .order("created_at", { ascending: false });

  if (!org?.is_premium) {
    return <PremiumRequired role={member.role} />;
  }

  return (
    <>
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.65),rgba(235,238,245,0.4))]" />
        <div className="absolute top-[-180px] left-[10%] w-[560px] h-[560px] rounded-full bg-[rgba(148,163,255,0.22)] blur-[150px]" />
        <div className="absolute bottom-[-220px] right-[10%] w-[540px] h-[540px] rounded-full bg-[rgba(120,200,255,0.18)] blur-[160px]" />
      </div>

      <div className="space-y-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
              Roller
            </h1>
            <p className="text-sm text-black/50 mt-2">
              Organizasyondaki kullanıcı rollerini yönetin.
            </p>
          </div>

          <CreateRoleModal />
        </div>

       {/* Table */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-2xl p-4 sm:p-6 border shadow-xl">
          {/* DESKTOP / TABLET */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                {/* Sabit kolon genişliği: kaymayı engeller */}
                <colgroup>
                  <col className="w-auto" />
                  <col className="w-[160px]" />
                  <col className="w-[220px]" />
                </colgroup>

                <thead className="border-b bg-white/50">
                  <tr>
                    <th className="p-4 text-left">Rol Adı</th>
                    <th className="p-4 text-left">Oluşturulma</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>

                <tbody>
                  {!roles?.length && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center p-12 text-black/50 text-lg"
                      >
                        Henüz rol tanımlanmamış.
                      </td>
                    </tr>
                  )}

                  {roles?.map((role) => (
                    <tr key={role.id} className="border-b hover:bg-white/70 transition">
                      {/* Rol adı: taşarsa kırp */}
                      <td className="p-4 font-medium truncate">
                        {role.name}
                      </td>

                      <td className="p-4">
                        {new Date(role.created_at).toLocaleDateString("tr-TR")}
                      </td>

                      {/* İşlemler: asla kırılmasın, sağa yaslı kalsın */}
                      <td className="p-4">
                        <div className="flex justify-end gap-2 whitespace-nowrap">
                          <EditRoleModal role={role} />
                          <DeleteRoleDialog roleId={role.id} roleName={role.name} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE */}
          <div className="md:hidden space-y-3">
            {!roles?.length ? (
              <div className="text-center p-10 text-black/50">
                Henüz rol tanımlanmamış.
              </div>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-2xl border bg-white/70 backdrop-blur-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold truncate">
                        {role.name}
                      </div>
                      <div className="mt-1 text-[12px] text-black/50">
                        {new Date(role.created_at).toLocaleDateString("tr-TR")}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <EditRoleModal role={role} />
                      <DeleteRoleDialog roleId={role.id} roleName={role.name} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
