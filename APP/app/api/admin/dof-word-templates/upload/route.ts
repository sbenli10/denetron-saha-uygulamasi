import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const formData = await req.formData();

  const file = formData.get("file") as File;
  const name = formData.get("name") as string;
  const version = formData.get("version") as string;

  if (!file || !name || !version) {
    return NextResponse.json(
      { error: "Eksik alanlar" },
      { status: 400 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Yetkisiz" },
      { status: 401 }
    );
  }

  const { data: org } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!org) {
    return NextResponse.json(
      { error: "Organizasyon bulunamadı" },
      { status: 404 }
    );
  }

  const filePath = `v${version}/${crypto.randomUUID()}.docx`;

  // Storage upload
  const { error: uploadError } = await supabase.storage
    .from("dof-templates")
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 400 }
    );
  }

  // DB insert
  await supabase.from("dof_word_templates").insert({
    org_id: org.org_id,
    name,
    version,
    file_path: filePath,
    is_active: false,
    created_by: user.id,
  });

  return NextResponse.json({ success: true });
}
