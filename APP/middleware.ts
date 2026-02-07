import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";


export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Herkese açık sayfalar
  const publicPaths = [
    "/login",
    "/register",
    "/invite",
    "/reset-password",
    "/auth", // forgot-password vb
  ];

  

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Korunan alanlar
  const protectedPaths = ["/admin", "/operator"];

  if (!protectedPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ✅ Supabase v2 session cookie kontrolü
  const hasSession = req.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        c.name.endsWith("-auth-token")
    );

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/operator/:path*"],
};
