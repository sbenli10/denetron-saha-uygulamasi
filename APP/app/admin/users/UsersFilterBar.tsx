// APP/app/admin/users/UsersFilterBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function UsersFilterBar({
  roles,
}: {
  roles: { id: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [role, setRole] = useState(params.get("role") ?? "all");
  const [domain, setDomain] = useState(params.get("domain") ?? "");
  const [onlyTasks, setOnlyTasks] = useState(params.get("tasks") === "1");
  const [onlyActive, setOnlyActive] = useState(params.get("active") === "1");

  function update() {
    const q = new URLSearchParams();

    if (search) q.set("search", search);
    if (role !== "all") q.set("role", role);
    if (domain) q.set("domain", domain);
    if (onlyTasks) q.set("tasks", "1");
    if (onlyActive) q.set("active", "1");

    router.push(`/admin/users?${q.toString()}`);
  }

  useEffect(update, [search, role, domain, onlyTasks, onlyActive]);

  return (
    <div className="space-y-4">

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="İsim veya email ara..."
        className="
          w-full px-4 py-2 rounded-lg
          bg-white/50 border border-white/70
          text-sm text-black placeholder:text-black/40
          focus:ring-2 focus:ring-black/20
        "
      />

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {/* Dynamic roles */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="
            bg-white/50 border border-white/70
            px-3 py-2 rounded-lg text-sm text-black
          "
        >
          <option value="all">Tüm Roller</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="firma.com"
          className="
            bg-white/50 border border-white/70
            px-3 py-2 rounded-lg text-sm text-black
          "
        />

        <label className="flex items-center gap-2 text-sm text-black/80">
          <input
            type="checkbox"
            checked={onlyTasks}
            onChange={(e) => setOnlyTasks(e.target.checked)}
          />
          Görev atananlar
        </label>

        <label className="flex items-center gap-2 text-sm text-black/80">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
          />
          Aktif üyeler
        </label>

      </div>
    </div>
  );
}
