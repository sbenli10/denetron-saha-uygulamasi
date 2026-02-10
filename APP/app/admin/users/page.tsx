// APP/app/admin/users/page.tsx
export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import PendingInvites from "./PendingInvites";
import UsersTable from "./UsersTable";
import InviteUserForm from "./InviteUserForm";
import UsersSearchBar from "./UsersSearchBar";
import UsersFilterBar from "./UsersFilterBar";
import UsersSortBar from "./UsersSortBar";

export default async function AdminUsersPage() {
  const { member, org } = await getAdminContext();
  const admin = supabaseServiceRoleClient();

  /* ---------------------------------------------------------
     0 — 🔔 PENDING INVITE COUNT
  --------------------------------------------------------- */
  const now = new Date().toISOString();

  const { count: pendingInviteCount } = await admin
    .from("invites")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("used", false)
    .gt("expires_at", now);

  const inviteCount = pendingInviteCount ?? 0;

  /* ---------------------------------------------------------
     1 — MEMBERS + ROLE JOIN
  --------------------------------------------------------- */
  const { data: rows } = await admin
    .from("org_members")
    .select(`
      id,
      role_id,
      user_id,
      roles:role_id ( id, name )
    `)
    .eq("org_id", member.org_id)
    .is("deleted_at", null);

  const membersRaw = rows ?? [];

  /* ---------------------------------------------------------
     2 — PROFILES
  --------------------------------------------------------- */
  const userIds = membersRaw.map((m) => m.user_id);

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds.length ? userIds : ["00000000-0000"]);

  /* ---------------------------------------------------------
     3 — NORMALIZE MEMBERS
  --------------------------------------------------------- */
  const members = membersRaw.map((m) => {
    const profile = profiles?.find((p) => p.id === m.user_id);
    const roleObj = Array.isArray(m.roles) ? m.roles[0] : m.roles;

    return {
      id: m.id,
      role_id: m.role_id,
      role_name: roleObj?.name ?? "-",
      user: {
        id: m.user_id,
        full_name: profile?.full_name ?? "-",
        email: profile?.email ?? "-",
      },
    };
  });

  /* ---------------------------------------------------------
     4 — ROLES
  --------------------------------------------------------- */
  const { data: rolesData } = await admin
    .from("roles")
    .select("id, name")
    .eq("org_id", member.org_id);

  const roles = rolesData ?? [];

  /* ---------------------------------------------------------
     PAGE RENDER
  --------------------------------------------------------- */
  return (
    <>
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden isolation-isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.65),rgba(235,238,245,0.40),rgba(215,218,230,0.25))]" />
        <div className="absolute top-[-180px] left-[10%] w-[560px] h-[560px] bg-[rgba(148,163,255,0.22)] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-220px] right-[10%] w-[540px] h-[540px] bg-[rgba(120,200,255,0.18)] blur-[160px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.20),transparent_70%)]" />
      </div>

      <div className="space-y-12 relative z-20">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight bg-gradient-to-r from-[#1A1A1A] to-[#5A5A5A] bg-clip-text text-transparent">
              Üyeler

              {/* 🔔 BADGE */}
              {inviteCount > 0 && (
                <span
                  className="
                    text-sm font-medium
                    px-3 py-1 rounded-full
                    bg-[#6366F1]/10 text-[#6366F1]
                  "
                >
                  {inviteCount}
                </span>
              )}
            </h1>

            <p className="text-[13px] text-black/50 mt-2">
              Organizasyondaki tüm kullanıcıları yönetin, filtreleyin ve
              yönlendirin.
            </p>
          </div>

          <InviteUserForm orgId={org.id} roles={roles} />
        </div>

        {/* SEARCH */}
        <div className="rounded-2xl bg-white/50 backdrop-blur-2xl border border-white/70 shadow-[0_8px_28px_rgba(0,0,0,0.12)] p-6">
          <UsersSearchBar />
        </div>

        {/* FILTER + SORT */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white/50 backdrop-blur-2xl border border-white/70 shadow-[0_8px_28px_rgba(0,0,0,0.12)] p-6">
            <UsersFilterBar roles={roles} />
          </div>

          <div className="rounded-2xl bg-white/50 backdrop-blur-2xl border border-white/70 shadow-[0_8px_28px_rgba(0,0,0,0.12)] p-6">
            <UsersSortBar />
          </div>
        </div>

        {/* 🔔 PENDING INVITES */}
        <PendingInvites orgId={org.id} />

        {/* USERS TABLE */}
        <div className="rounded-3xl bg-white/50 backdrop-blur-2xl border border-white/70 shadow-[0_8px_28px_rgba(0,0,0,0.12)] p-6">
          <div className="overflow-x-auto rounded-2xl bg-white/60 border border-white/70 backdrop-blur-xl shadow-inner shadow-[inset_0_0_25px_rgba(255,255,255,0.45)]">
            <UsersTable members={members} orgId={org.id} roles={roles} />
          </div>
        </div>
      </div>
    </>
  );
}
