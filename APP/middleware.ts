// APP/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicRoutes = [
    "/login",
    "/register",
    "/invite",
    "/api/login",
    "/api/register",
  ];

  if (publicRoutes.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ✅ Supabase v2 refresh token kontrolü
  const hasSession = req.cookies
    .getAll()
    .some(c =>
      c.name.startsWith("sb-") &&
      c.name.endsWith("-refresh-token")
    );

  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
