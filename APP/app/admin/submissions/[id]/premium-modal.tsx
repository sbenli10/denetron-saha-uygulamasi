"use client";

import { Crown, Lock } from "lucide-react";

interface PremiumModalProps {
  onClose: () => void;
  role: string;
}

export default function PremiumModal({ onClose, role }: PremiumModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl relative">

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-black"
        >
          ✕
        </button>

        <div className="flex justify-center mb-4">
          <div className="h-20 w-20 rounded-2xl bg-yellow-200 flex items-center justify-center shadow">
            <Crown size={40} className="text-yellow-700" />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold">Premium Gerekli</h2>
        <p className="text-center text-gray-600 mt-2">
          Bu özellik yalnızca <strong>Premium</strong> organizasyonlara açıktır.
        </p>

        {role === "admin" ? (
          <div className="flex justify-center mt-6">
            <a
              href="/admin/upgrade"
              className="bg-yellow-400 px-5 py-3 rounded-xl font-semibold shadow"
            >
              Premium’a Geç
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mt-6 text-gray-500 text-sm">
            <Lock size={16} />
            Lütfen yöneticinizle iletişime geçin.
          </div>
        )}
      </div>
    </div>
  );
}
