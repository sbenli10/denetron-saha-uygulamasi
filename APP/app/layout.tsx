// APP/app/layout.tsx
import "./globals.css";
import { AppProvider } from "@/components/providers/AppProvider";
import { Toaster } from "sonner";
import { supabaseServerClient } from "@/lib/supabase/server";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = supabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="tr">
      <body>
        <AppProvider initialUser={user}>
          {children}
        </AppProvider>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
