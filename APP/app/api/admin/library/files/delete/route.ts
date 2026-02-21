import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.info("========== FILE DELETE PROCESS START ==========");
  
  const supabase = supabaseServerClient();
  
  // 1. Gelen Veriyi Al ve Logla
  let body;
  try {
    body = await req.json();
    console.info("[REQ] Payload received:", body);
  } catch (e) {
    console.error("[REQ] Failed to parse JSON body");
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const { id, file_path } = body; // 👈 file_id yerine id yazdık

    if (!id) { // 👈 Burayı da id olarak güncelledik
    console.warn("[VALIDATION] Missing id");
    return NextResponse.json({ error: "Dosya ID gerekli" }, { status: 400 });
    }

  try {
    // 3. Fiziksel Dosyayı Storage'dan Sil
    if (file_path) {
      console.info("[STORAGE] Attempting to remove file from storage:", file_path);
      
      const { error: storageError } = await supabase.storage
        .from("library")
        .remove([file_path]);
        
      if (storageError) {
        // Storage hatası kritik olmayabilir (dosya zaten silinmiş olabilir), 
        // bu yüzden warn ile geçip logluyoruz.
        console.warn("[STORAGE] Storage deletion warning/error:", storageError);
      } else {
        console.info("[STORAGE] File successfully removed from storage");
      }
    } else {
      console.warn("[STORAGE] No file_path provided, skipping storage removal");
    }

    // 4. Veritabanı Kaydını Sil
    console.info("[DB] Attempting to delete record from 'library_files':", id);
    
   const { error: dbError } = await supabase
    .from("library_files")
    .delete()
    .eq("id", id);

    if (dbError) {
      console.error("[DB] Database deletion failed:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    console.info("[DB] Record successfully deleted from database");
    console.info("========== FILE DELETE PROCESS SUCCESS ==========");

    return NextResponse.json({ success: true });

  } catch (unexpectedError) {
    console.error("[CRITICAL] Unexpected error during file deletion:", unexpectedError);
    return NextResponse.json({ error: "Sunucu hatası oluştu" }, { status: 500 });
  }
}