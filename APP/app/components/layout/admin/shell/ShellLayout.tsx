//APP\app\components\layout\admin\shell\ShellLayout.tsx
import ClientShell from "./ClientShell";
import { supabaseServerClient } from "@/lib/supabase/server";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = supabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id;

  if (!orgId) {
    return (
      <div className="p-10 text-center text-red-500">
        Organizasyon bilgisi bulunamadı.
      </div>
    );
  }

  return (
    <ClientShell userId={user.id} orgId={orgId}>
      {children}
    </ClientShell>
  );
}
