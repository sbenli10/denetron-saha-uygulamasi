import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
  }

  // 1. Önce bu klasöre ait dosyaları sil (Veritabanı kısıtlamasını aşmak için)
  const { error: fileError } = await supabase
    .from("library_files")
    .delete()
    .eq("folder_id", id);

  if (fileError) {
    console.error("Dosyalar silinemedi:", fileError);
    return NextResponse.json({ error: "Klasör içindeki dosyalar temizlenemedi" }, { status: 500 });
  }

  // 2. Varsa alt klasörleri de temizle (Recursive yapı için)
  // Not: Eğer çok derin bir hiyerarşiniz varsa bu kısmı bir transaction içinde yapmalısınız.

  // 3. Şimdi klasörü sil
  const { error: folderError } = await supabase
    .from("library_folders")
    .delete()
    .eq("id", id);

  if (folderError) {
    console.error("Klasör silme hatası:", folderError);
    return NextResponse.json({ error: folderError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}