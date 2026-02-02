//APP\app\api\admin\library\upload\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.info("========== LIBRARY FILE UPLOAD START ==========");

  const supabase = supabaseServerClient();

  /* ================= FORM DATA ================= */

  let formData: FormData;

  try {
    formData = await req.formData();
  } catch (e) {
    console.error("[REQ] Failed to parse formData", e);
    return NextResponse.json(
      { error: "Geçersiz form verisi" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const folder_id = formData.get("folder_id") as string | null;

  console.info("[REQ] Form data received:", {
    hasFile: Boolean(file),
    folder_id,
  });

  if (!file) {
    console.warn("[VALIDATION] File missing");
    return NextResponse.json(
      { error: "Dosya bulunamadı" },
      { status: 400 }
    );
  }

  console.info("[FILE] Metadata:", {
    name: file.name,
    type: file.type,
    size: file.size,
  });

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

  console.info("[DB] Profile resolved:", profile);

  /* ================= STORAGE UPLOAD ================= */

  const filePath = `library/${profile?.organization_id}/${Date.now()}-${file.name}`;

  console.info("[STORAGE] Uploading file:", {
    bucket: "library",
    path: filePath,
  });

  const { error: uploadError } = await supabase.storage
    .from("library")
    .upload(filePath, file);

  if (uploadError) {
    console.error("[STORAGE] Upload failed:", uploadError);
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  console.info("[STORAGE] Upload successful");

  /* ================= PUBLIC URL ================= */

  const { data: publicUrl } = supabase.storage
    .from("library")
    .getPublicUrl(filePath);

  console.info("[STORAGE] Public URL generated:", publicUrl?.publicUrl);

  /* ================= DATABASE INSERT ================= */

  const insertPayload = {
    name: file.name,
    folder_id: folder_id ?? null,
    file_url: publicUrl.publicUrl,
    mime_type: file.type,
    size: file.size,
    org_id: profile?.organization_id,
  };

  console.info("[DB] Inserting file record:", insertPayload);

  const { error: dbError } = await supabase
    .from("library_files")
    .insert(insertPayload);

  if (dbError) {
    console.error("[DB] File record insert failed:", dbError);
    return NextResponse.json(
      { error: dbError.message },
      { status: 500 }
    );
  }

  console.info("[DB] File record successfully created");

  console.info("========== LIBRARY FILE UPLOAD END ==========");

  return NextResponse.json({ success: true });
}
