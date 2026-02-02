// APP/app/admin/roles/[id]/page.tsx
export const dynamic = "force-dynamic";

import ShellLayout from "@/components/layout/admin/shell/ShellLayout";
import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { updateRole } from "./actions";

const PERMISSIONS = [
  "operator.view",
  "operator.update",
  "tasks.create",
  "tasks.assign",
  "tasks.close",
  "submissions.review",
  "templates.create",
  "templates.edit",
  "admin.access",
];

export default async function EditRolePage({ params }: { params: { id: string } }) {
  const { member } = await getAdminContext();
  const admin = supabaseServiceRoleClient();

  const { data: role } = await admin
    .from("roles")
    .select("*")
    .eq("id", params.id)
    .eq("org_id", member.org_id)
    .single();

  if (!role) {
    return (
      <ShellLayout>
        <div className="text-red-600 font-medium text-lg">Rol bulunamadı.</div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      {/* ================================
            macOS SONOMA BACKGROUND FX
      ================================= */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        
        {/* Soft pastel blobs */}
        <div className="absolute -top-44 -left-32 w-[600px] h-[600px] rounded-full bg-[rgba(145,160,255,0.28)] blur-[150px]" />
        <div className="absolute -bottom-48 -right-20 w-[580px] h-[580px] rounded-full bg-[rgba(130,210,255,0.25)] blur-[180px]" />

        {/* Central frosted glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.35),transparent_70%)]" />
      </div>

      <div className="relative space-y-12">

        {/* ================================
                HEADER
        ================================= */}
        <div>
          <h1
            className="
              text-4xl font-semibold tracking-tight
              bg-gradient-to-r from-[#1B1B1B] to-[#404040]
              bg-clip-text text-transparent
            "
          >
            Rol Düzenle
          </h1>

          <p className="text-sm text-black/50 mt-2">
            Rol adı ve izin yapılarını güncelleyin.
          </p>
        </div>

        {/* ================================
                FORM CONTAINER
        ================================= */}
        <form action={(formData) => updateRole(role.id, formData)}>
          <div
            className="
              p-10 rounded-3xl
              bg-white/45 backdrop-blur-2xl
              border border-white/60
              shadow-[0_8px_40px_rgba(0,0,0,0.12)]
              space-y-10
            "
          >

            {/* ================================
                    ROLE NAME INPUT
            ================================= */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-black/70">
                Rol Adı
              </label>

              <input
                name="name"
                defaultValue={role.name}
                required
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/70 backdrop-blur
                  border border-black/10
                  text-black placeholder-black/40
                  focus:ring-2 focus:ring-indigo-400
                  transition-all
                "
                placeholder="Örn: Süpervizör"
              />
            </div>

            {/* ================================
                    PERMISSIONS
            ================================= */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-black/70">
                İzinler
              </label>

              <div
                className="
                  grid grid-cols-1 sm:grid-cols-2 gap-3
                  max-h-80 overflow-y-auto
                  p-5 rounded-xl
                  bg-white/55 backdrop-blur-xl
                  border border-black/10 
                  shadow-inner
                "
              >
                {PERMISSIONS.map((p) => (
                  <label
                    key={p}
                    className="
                      flex items-center gap-3 p-2.5 select-none
                      rounded-lg cursor-pointer
                      bg-white/30 border border-black/10
                      hover:bg-white/50 hover:shadow-sm
                      transition-all
                    "
                  >
                    <input
                      type="checkbox"
                      name="permissions"
                      value={p}
                      defaultChecked={role.permissions.includes(p)}
                      className="
                        w-4 h-4 accent-indigo-500
                        rounded border border-black/30
                      "
                    />

                    <span className="text-sm text-black/75 font-medium">
                      {p}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ================================
                    SAVE BUTTON
            ================================= */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="
                  px-7 py-3 rounded-xl font-medium
                  bg-gradient-to-br from-indigo-500 to-indigo-600
                  text-white 
                  shadow-[0_4px_18px_rgba(0,0,0,0.18)]
                  hover:shadow-[0_6px_25px_rgba(0,0,0,0.22)]
                  hover:brightness-110
                  active:scale-95
                  transition-all
                "
              >
                Kaydet
              </button>
            </div>

          </div>
        </form>

      </div>
    </ShellLayout>
  );
}
