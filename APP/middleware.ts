// APP/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // 🔹 Response mutlaka başta oluşturulmalı
  const res = NextResponse.next();

  const pathname = req.nextUrl.pathname;

  // 🔹 Public routes (middleware hiç dokunmaz)
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/register")
  ) {
    return res;
  }

  // 🔹 Env guard (prod’da yoksa crash yerine redirect)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🔹 Supabase Edge-safe client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 🔹 SESSION FETCH — try/catch ZORUNLU
  let session = null;

  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch {
    // Edge runtime’da patlamaması için sessiz geç
    session = null;
  }

  // 🔹 Auth required routes
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
