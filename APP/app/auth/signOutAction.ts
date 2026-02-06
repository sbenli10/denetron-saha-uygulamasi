"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * HARD SIGN OUT
 * - Supabase session'ı kapatır
 * - Tüm auth cookie'lerini temizler
 * - Next.js RSC cache sızıntısını keser
 * - Kullanıcıyı temiz /login'e gönderir
 */
export async function signOutAction() {
  const supabase = supabaseServerClient();

  /* --------------------------------------------------
     1) SUPABASE SESSION DESTROY
  -------------------------------------------------- */
  await supabase.auth.signOut();

  /* --------------------------------------------------
     2) AUTH COOKIE HARD RESET
     (sb-*-auth-token dahil)
  -------------------------------------------------- */
  const cookieStore = cookies();

  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
      });
    }
  }

  /* --------------------------------------------------
     3) REDIRECT (CLEAN ENTRY)
  -------------------------------------------------- */
  redirect("/login");
}
