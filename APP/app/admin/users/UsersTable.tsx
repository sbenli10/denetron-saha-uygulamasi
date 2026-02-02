// APP/app/admin/users/UsersTable.tsx
"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

export interface Member {
  id: string;
  role_id: string | null;
  role_name: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface Role {
  id: string;
  name: string;
}

export default function UsersTable({
  members,
  orgId,
  roles,
}: {
  members: Member[];
  orgId: string;
  roles: { id: string; name: string }[];
}) {
  async function deleteUser(userId: string) {
    if (!confirm("Bu üyeyi silmek istediğinize emin misiniz?")) return;

    await fetch("/api/admin/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, orgId }),
    });

    window.location.reload();
  }

  return (
    <table className="w-full text-sm">

      {/* Header */}
      <thead className="bg-white/70 text-black/60 border-b border-black/10 backdrop-blur-xl">
        <tr>
          <th className="p-4 text-left font-medium">İsim</th>
          <th className="p-4 text-left font-medium">E-posta</th>
          <th className="p-4 text-left font-medium">Rol</th>
          <th className="p-4 text-right font-medium">İşlem</th>
        </tr>
      </thead>

      {/* Body */}
      <tbody>
        {members.map((m, i) => (
          <motion.tr
            key={m.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.03 }}
            className="
              border-b border-black/10 
              transition-all
              hover:bg-white/80 hover:backdrop-blur-xl
              hover:shadow-[0_0_18px_rgba(0,0,0,0.06)]
            "
          >
            <td className="p-4 font-medium text-black/80">{m.user.full_name}</td>
            <td className="p-4 text-black/60">{m.user.email}</td>
            <td className="p-4 text-black/60">{m.role_name}</td>

            <td className="p-4 text-right">
              <button
                onClick={() => deleteUser(m.user.id)}
                className="text-red-600 hover:text-red-700 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </td>
          </motion.tr>
        ))}

        {!members.length && (
          <tr>
            <td colSpan={4} className="p-12 text-center text-black/50 text-lg">
              Bu organizasyonda henüz üye bulunmuyor.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
