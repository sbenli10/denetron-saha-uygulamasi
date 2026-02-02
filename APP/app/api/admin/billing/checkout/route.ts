import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/context";

/**
 * Şimdilik MOCK checkout.
 * Stripe/iyzico bağlayınca burada gerçek session oluşturulacak.
 */
export async function GET() {
  const { org, member } = await getAdminContext();

  const isAdmin = member.role?.toLowerCase() === "admin";
  if (!isAdmin) {
    return NextResponse.redirect(new URL("/admin/upgrade?error=not_admin", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  // MOCK: kullanıcıyı "başarılı" sayfaya yönlendiriyoruz
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL(`/admin/upgrade/success?org=${org.id}`, base));
}
