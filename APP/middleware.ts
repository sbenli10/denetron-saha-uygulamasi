// APP/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  /**
   * 1️⃣ PUBLIC ROUTES
   * Login & auth akışları ASLA bloklanmaz
   */
  const publicPaths = [
    "/login",
    "/register",
    "/invite",
    "/reset-password",
    "/auth",
    "/api/auth",
  ];
  

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  /**
   * 2️⃣ SADECE PROTECTED ALANLARI KORU
   */
  const protectedPaths = ["/admin", "/operator"];
  const isProtected = protectedPaths.some((p) =>
    pathname.startsWith(p)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  /**
   * 3️⃣ SUPABASE SESSION VAR MI?
   * sb-*-auth-token cookie kontrolü
   */
  const hasSession = req.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        c.name.endsWith("-auth-token")
    );

  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  /**
   * 4️⃣ MFA GATE
   * - MFA gerekiyorsa ama tamamlanmamışsa
   * - Login sayfasına geri gönder
   */
  const mfaOk = req.cookies.get("mfa_ok")?.value === "1";

  if (!mfaOk) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("mfa", "1");
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  /**
   * 5️⃣ HER ŞEY TAMAM
   */
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/operator/:path*"],
};
