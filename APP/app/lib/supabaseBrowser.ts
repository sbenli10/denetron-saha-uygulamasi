// APP/app/lib/supabaseBrowser.ts
import { createBrowserClient } from "@supabase/ssr"; // ✅ DÜZELTME 1: Doğru kütüphaneden içe aktarın
import type { Database } from "./supabase.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null; // Tipi createBrowserClient'a göre güncelledik

export function supabaseBrowser() {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // ✅ DÜZELTME 2: createBrowserClient kullanıldı
    browserClient = createBrowserClient<Database>(url, anonKey); 
  }
  return browserClient;
}