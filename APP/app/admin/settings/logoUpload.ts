"use server";

import { supabaseServerClient, supabaseServiceRoleClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import crypto from "crypto";

export async function uploadLogo(formData: FormData) {
  console.log("[LOGO UPLOAD] started");

  const file = formData.get("file") as File;
  if (!file) {
    console.error("[LOGO UPLOAD] file missing");
    return { error: "File missing" };
  }

  const { member } = await getAdminContext();
  console.log("[LOGO UPLOAD] org_id:", member.org_id);

  const ext = file.name.split(".").pop();
  const filename = `${member.org_id}/${crypto.randomUUID()}.${ext}`;

  const admin = supabaseServiceRoleClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  console.log("[LOGO UPLOAD] uploading to storage:", filename);

  const { error: uploadErr } = await admin.storage
    .from("org-logos")
    .upload(filename, buffer, { contentType: file.type });

  if (uploadErr) {
    console.error("[LOGO UPLOAD] storage error:", uploadErr);
    return { error: uploadErr.message };
  }

  const { data } = admin.storage
    .from("org-logos")
    .getPublicUrl(filename);

  const publicUrl = data.publicUrl;
  console.log("[LOGO UPLOAD] public URL:", publicUrl);

  const { error: dbErr } = await admin
    .from("org_settings")
    .upsert(
      {
        org_id: member.org_id,
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "org_id",
      }
    );

  if (dbErr) {
    console.error("[ORG SETTINGS] DB ERROR:", dbErr);
    throw dbErr;
  }

  console.log("[LOGO UPLOAD] SUCCESS");

  return { success: true, url: publicUrl };
}
