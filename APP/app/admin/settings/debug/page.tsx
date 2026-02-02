export const dynamic = "force-dynamic";

import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

export default async function SettingsDebugPage() {
  console.log("========== SETTINGS DEBUG PAGE ==========");

  /* 1️⃣ ADMIN CONTEXT */
  const ctx = await getAdminContext();
  console.log("[DEBUG] getAdminContext:", ctx);

  const { org, member } = ctx;
  const admin = supabaseServiceRoleClient();

  /* 2️⃣ ORG SETTINGS */
  const { data: orgSettings, error: settingsError } = await admin
    .from("org_settings")
    .select("*")
    .eq("org_id", org.id)
    .single();

  console.log("[DEBUG] org_settings DB row:", orgSettings);
  console.log("[DEBUG] org_settings error:", settingsError);

  /* 3️⃣ AUTH USER (EMAIL İÇİN) */
  let authUser: any = null;

  if (member.user_id) {
    const { data } = await admin.auth.admin.getUserById(member.user_id);
    authUser = data?.user ?? null;
  }

  console.log("[DEBUG] auth user:", authUser);

  /* 4️⃣ LOGO URL KONTROL */
  let logoCheck: {
    url: string | null;
    fetchOk?: boolean;
    status?: number;
  } = { url: orgSettings?.logo_url ?? null };

  if (orgSettings?.logo_url) {
    try {
      const res = await fetch(orgSettings.logo_url, { method: "HEAD" });
      logoCheck.fetchOk = res.ok;
      logoCheck.status = res.status;
    } catch (e) {
      logoCheck.fetchOk = false;
      logoCheck.status = -1;
    }
  }

  console.log("[DEBUG] logo check:", logoCheck);

  /* 5️⃣ PDF PAYLOAD (GERÇEK) */
  const pdfPayload = {
    organization: {
      id: org.id,
      name: org.name,
      logo_url: orgSettings?.logo_url ?? null,
    },
    member: {
      user_id: member.user_id,
      role: member.role,
      email: authUser?.email ?? null,
    },
  };

  console.log("[DEBUG] PDF payload:", pdfPayload);

  return (
    <div style={{ padding: 32, fontFamily: "monospace" }}>
      <h1>⚙️ Ayarlar Debug Paneli</h1>

      <Section title="Admin Context">
        {ctx}
      </Section>

      <Section title="Organization">
        {org}
      </Section>

      <Section title="Member (Context)">
        {member}
      </Section>

      <Section title="Auth User (Email)">
        {authUser}
      </Section>

      <Section title="org_settings (DB)">
        {orgSettings}
      </Section>

      <Section title="Logo Kontrol">
        {logoCheck}
      </Section>

      <Section title="PDF’e Giden Veri">
        {pdfPayload}
      </Section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helper Component                                                           */
/* -------------------------------------------------------------------------- */
function Section({
  title,
  children,
}: {
  title: string;
  children: any;
}) {
  return (
    <div style={{ marginTop: 24 }}>
      <h2>{title}</h2>
      <pre
        style={{
          background: "#0b0b0b",
          color: "#00ff90",
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {JSON.stringify(children, null, 2)}
      </pre>
    </div>
  );
}
