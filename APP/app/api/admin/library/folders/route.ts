import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  console.info("========== LIST LIBRARY FOLDERS START ==========");

  const supabase = supabaseServerClient();

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

  console.info("[DB] Fetching user profile (organization)");

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

  /* ================= FOLDERS QUERY ================= */

  console.info("[DB] Fetching library folders for org:", profile?.organization_id);

  const { data, error } = await supabase
    .from("library_folders")
    .select("id, name, parent_id, is_locked")
    .eq("org_id", profile?.organization_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[DB] Folder fetch error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  console.info("[DB] Folders fetched:", {
    count: data?.length ?? 0,
  });

  console.info("========== LIST LIBRARY FOLDERS END ==========");

  return NextResponse.json({ folders: data });
}
