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
        <div className="rounded-3xl bg-white/60 backdrop-blur-2xl p-6 border shadow-xl">
          <table className="w-full text-sm">
            <thead className="border-b bg-white/50">
              <tr>
                <th className="p-4 text-left">Rol Adı</th>
                <th className="p-4 text-left">İzinler</th>
                <th className="p-4 text-left">Oluşturulma</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>

            <tbody>
              {!roles?.length && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center p-12 text-black/50 text-lg"
                  >
                    Henüz rol tanımlanmamış.
                  </td>
                </tr>
              )}

              {roles?.map((role) => (
                <tr
                  key={role.id}
                  className="border-b hover:bg-white/70 transition"
                >
                  <td className="p-4 font-medium">{role.name}</td>
                  <td className="p-4">
                    {role.permissions?.length
                      ? role.permissions.join(", ")
                      : "-"}
                  </td>
                  <td className="p-4">
                    {new Date(role.created_at).toLocaleDateString("tr-TR")}
                  </td>

                  <td className="p-4 flex justify-end gap-2">
                    <EditRoleModal role={role} />
                    <DeleteRoleDialog
                      roleId={role.id}
                      roleName={role.name}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
