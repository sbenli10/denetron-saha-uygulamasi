// APP/app/admin/users/PendingInvites.tsx
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import CancelInviteButton from "./CancelInviteButton";
import { unstable_noStore as noStore } from "next/cache";

/* ---------------------------------------
   TYPES
--------------------------------------- */
type InviteRow = {
  id: string;
  email: string | null;
  expires_at: string | null;
  role: string | null;
  roles: { name: string }[] | null;
};

/* ---------------------------------------
   UTILS
--------------------------------------- */
const isDev = process.env.NODE_ENV === "development";

function log(...args: any[]) {
  if (isDev) console.log(...args);
}

function resolveRoleName(invite: InviteRow): string {
  return invite.roles?.[0]?.name ?? invite.role ?? "-";
}

/* ---------------------------------------
   COMPONENT
--------------------------------------- */
export default async function PendingInvites({
  orgId,
}: {
  orgId: string;
}) {
  noStore(); // 🔥 cache tamamen kapalı

  log("🟦 [PendingInvites] render start → orgId:", orgId);

  const admin = supabaseServiceRoleClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("invites")
    .select(
      `
        id,
        email,
        expires_at,
        role,
        used,
        roles:role_id ( name )
      `
    )
    .eq("org_id", orgId)
    .eq("used", false)
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [PendingInvites] Supabase error:", error);
    return null;
  }

  const invites = (data ?? []) as InviteRow[];

  log("📊 [PendingInvites] active invites:", invites.length);

  if (invites.length === 0) {
    log("✅ [PendingInvites] no active invites");
    return null;
  }

  return (
    <section
      className="
        rounded-3xl
        bg-white/50 backdrop-blur-2xl
        border border-white/70
        shadow-[0_8px_28px_rgba(0,0,0,0.12)]
        p-6
      "
    >
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          Bekleyen Davetler
        </h3>
        <span className="text-sm text-black/50">
          {invites.length} adet
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-black/60 border-b">
            <tr>
              <th className="py-2 text-left">E-posta</th>
              <th className="py-2 text-left">Rol</th>
              <th className="py-2 text-left">Son Geçerlilik</th>
              <th className="py-2 text-right">İşlem</th>
            </tr>
          </thead>

          <tbody>
            {invites.map((invite) => {
              const roleName = resolveRoleName(invite);

              log("➡️ [PendingInvites] row:", {
                id: invite.id,
                email: invite.email,
                roleName,
                expires_at: invite.expires_at,
              });

              return (
                <tr
                  key={invite.id}
                  className="border-b last:border-none"
                >
                  <td className="py-3">
                    {invite.email ?? "-"}
                  </td>

                  <td className="py-3">
                    {roleName}
                  </td>

                  <td className="py-3">
                    {invite.expires_at
                      ? new Date(invite.expires_at).toLocaleDateString(
                          "tr-TR"
                        )
                      : "-"}
                  </td>

                  <td className="py-3 text-right">
                    <CancelInviteButton inviteId={invite.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
