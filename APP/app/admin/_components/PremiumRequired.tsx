// APP/app/admin/_components/PremiumRequired.tsx
"use client";

import { Crown, Lock } from "lucide-react";
import Link from "next/link";

export default function PremiumRequired({
  role,
}: {
  role: string | null;
}) {
  const isAdmin = role?.toLowerCase() === "admin";

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 min-h-[60vh] relative">

      {/* Ambient Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] -top-40 left-1/2 -translate-x-1/2 bg-indigo-300/20 blur-[140px] rounded-full" />
        <div className="absolute w-[500px] h-[500px] bottom-[-120px] right-1/4 bg-blue-300/20 blur-[180px] rounded-full" />
      </div>

      {/* Glass Card */}
      <div
        className="
          relative max-w-lg w-full
          rounded-3xl p-10
          bg-white/25
          backdrop-blur-2xl
          border border-white/40
          shadow-[0_8px_40px_rgba(0,0,0,0.18)]
          ring-1 ring-white/20
        "
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="
              h-20 w-20 flex items-center justify-center
              rounded-2xl
              bg-gradient-to-br from-yellow-200 to-yellow-400
              shadow-[0_4px_25px_rgba(255,215,0,0.45)]
            "
          >
            <Crown size={40} className="text-yellow-700" />
          </div>
        </div>

        {/* Title */}
        <h2
          className="
            text-3xl font-extrabold text-center
            bg-gradient-to-r from-black via-yellow-600 to-black
            bg-clip-text text-transparent
            drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]
          "
        >
          Premium Gerekli
        </h2>

        {/* Description */}
        <p className="text-center text-black/70 mt-4 leading-relaxed">
          Bu özellik yalnızca <strong>Premium organizasyonlar</strong> tarafından kullanılabilir.
          Şu anda bulunduğunuz organizasyon Premium plana sahip değil.
        </p>

        {/* CTA OR Locked Explanation */}
        {isAdmin ? (
          <div className="flex justify-center mt-7">
            <Link
              href="/admin/upgrade"
              className="
                px-6 py-3 rounded-2xl
                bg-gradient-to-br from-yellow-300 to-yellow-500
                text-black font-medium
                shadow-[0_4px_20px_rgba(255,215,0,0.45)]
                hover:shadow-[0_6px_25px_rgba(255,215,0,0.55)]
                transition-all
              "
            >
              Premium’a Yükselt
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm text-black/60 mt-6">
            <Lock size={18} />
            Bu özelliği kullanmak için yöneticinizle iletişime geçin.
          </div>
        )}
      </div>
    </div>
  );
}
