// APP/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 🔹 Public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/register")
  ) {
    return NextResponse.next();
  }

  // 🔹 Supabase auth cookie (name'ler projeye göre değişebilir)
  const hasAccessToken =
    req.cookies.get("sb-access-token") ||
    req.cookies.get("sb-refresh-token");

  if (!hasAccessToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
