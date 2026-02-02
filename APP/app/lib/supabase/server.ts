// APP/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export function supabaseServerClient(rememberMe?: boolean) {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({
            name,
            value,
            ...options,
            ...(rememberMe !== undefined && {
              maxAge: rememberMe
                ? 60 * 60 * 24 * 30 // 30 gün
                : 60 * 60 * 2,      // 2 saat
            }),
          });
        },
        remove(name: string, options) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}
export function supabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase service role için env değişkenleri eksik.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });
}

export { createServerClient };
