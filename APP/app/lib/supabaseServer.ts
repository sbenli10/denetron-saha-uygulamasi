// APP/lib/supabaseServer.ts
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Sunucu tarafında supabase client oluşturur.
 * getOperatorContext ve admin tarafı bu fonksiyonu kullanabilir.
 */
export async function supabaseServer() {
  // supabaseServerClient zaten bir Supabase client döndürüyor.
  // async yapmamızın sebebi: mevcut kodlarda `await supabaseServer()` kullanıyor olman.
  return supabaseServerClient();
}
