// APP/app/api/dof/manual/item/upload-evidence/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const formData = await req.formData();

  const files = formData.getAll("files") as File[];
  const dofItemId = formData.get("dof_item_id") as string;
  const type = (formData.get("type") as string) ?? "before";

  if (!files.length || !dofItemId) {
    return NextResponse.json(
      { error: "Dosya(lar) ve dof_item_id zorunludur" },
      { status: 400 }
    );
  }

  /* 1️⃣ AUTH */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!orgMember) {
    return NextResponse.json(
      { error: "Organizasyon bulunamadı" },
      { status: 400 }
    );
  }

  /* 2️⃣ LOOP: STORAGE + DB */
  for (const file of files) {
    const ext = file.name.split(".").pop();
    const storagePath = `dof/${dofItemId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("evidences")
      .upload(storagePath, file);

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 400 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("evidences")
      .getPublicUrl(storagePath);

    const { data: storedFile, error: fileError } = await supabase
      .from("files")
      .insert({
        organization_id: orgMember.org_id,
        user_id: user.id,
        url: publicUrlData.publicUrl,
        type: file.type.startsWith("image") ? "image" : "file",
      })
      .select()
      .single();

    if (fileError) {
      return NextResponse.json(
        { error: fileError.message },
        { status: 400 }
      );
    }

    await supabase.from("dof_item_files").insert({
      dof_item_id: dofItemId,
      file_id: storedFile.id,
      type,
    });
  }

  return NextResponse.json({ success: true });
}
