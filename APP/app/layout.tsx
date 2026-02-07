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
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AppProvider>
          {children}
          <Toaster
            richColors
            position="top-right"
            closeButton
          />
        </AppProvider>
      </body>
    </html>
  );
}
