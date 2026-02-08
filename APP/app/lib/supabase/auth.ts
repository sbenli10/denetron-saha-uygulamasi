// APP/app/lib/supabase/auth.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/app/lib/supabase.types";

let supabase: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function supabaseAuth() {
  if (!supabase) {
    supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      }
    );
  }

  return supabase;
}
