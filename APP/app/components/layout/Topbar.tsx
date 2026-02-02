//APP\app\components\layout\Topbar.tsx
"use client";

import { Menu, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function Topbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const supabase = supabaseClient();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="bg-white border-b shadow-sm h-16 flex items-center px-6 justify-between">
      
      {/* left: sidebar toggle */}
      <button onClick={toggleSidebar}>
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* right: user info */}
      <div className="flex items-center space-x-4">
        <User className="w-5 h-5 text-gray-700" />

        <button
          onClick={logout}
          className="flex items-center space-x-2 text-gray-600 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>Çıkış</span>
        </button>
      </div>
    </header>
  );
}
