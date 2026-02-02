//APP\app\lib\supabase\client.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function supabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
