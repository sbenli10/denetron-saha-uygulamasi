// APP/app/api/admin/library/folders/create/route.ts

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.info("========== CREATE LIBRARY FOLDER START ==========");

  const supabase = supabaseServerClient();

  /* ================= REQUEST ================= */

  let body: any = null;

  try {
    body = await req.json();
  } catch (e) {
    console.error("[REQ] Invalid JSON body", e);
    return NextResponse.json(
      { error: "Geçersiz JSON" },
      { status: 400 }
    );
  }

  console.info("[REQ] Body received:", body);

  const { name, parent_id } = body;

  if (!name) {
    console.warn("[VALIDATION] Folder name missing");
    return NextResponse.json(
      { error: "Klasör adı zorunludur" },
      { status: 400 }
    );
  }

  /* ================= AUTH ================= */

  console.info("[AUTH] Fetching authenticated user");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[AUTH] Error while fetching user:", authError);
  }

  if (!user) {
    console.warn("[AUTH] Unauthorized request");
    return NextResponse.json(
      { error: "Yetkisiz" },
      { status: 401 }
    );
  }

  console.info("[AUTH] User authenticated:", {
    id: user.id,
    email: user.email,
  });

  /* ================= PROFILE ================= */

  console.info("[DB] Fetching user profile for organization");

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[DB] Profile fetch error:", profileError);
  }

  console.info("[DB] Profile result:", profile);

  /* ================= INSERT ================= */

  const insertPayload = {
    name,
    parent_id: parent_id ?? null,
    org_id: profile?.organization_id ?? null,
  };

  console.info("[DB] Inserting library folder:", insertPayload);

  const { error: insertError } = await supabase
    .from("library_folders")
    .insert(insertPayload);

  if (insertError) {
    console.error("[DB] Insert failed:", insertError);
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  console.info("[DB] Folder successfully created");

  console.info("========== CREATE LIBRARY FOLDER END ==========");

  return NextResponse.json({ success: true });
}
