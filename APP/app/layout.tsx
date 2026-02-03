// APP/app/layout.tsx
import "./globals.css";
import { AppProvider } from "@/components/providers/AppProvider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
