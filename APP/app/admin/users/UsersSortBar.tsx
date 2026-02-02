// APP/app/admin/users/UsersSortBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function UsersSortBar() {
  const router = useRouter();
  const params = useSearchParams();

  const sort = params.get("sort") ?? "name";
  const order = params.get("order") ?? "asc";

  function update(newSort: string, newOrder: string) {
    const q = new URLSearchParams(params.toString());
    q.set("sort", newSort);
    q.set("order", newOrder);
    router.push(`/admin/users?${q.toString()}`);
  }

  return (
    <div className="flex gap-4">

      <select
        value={sort}
        onChange={(e) => update(e.target.value, order)}
        className="
          bg-white/50 border border-white/70
          px-3 py-2 rounded-lg text-sm text-black
        "
      >
        <option value="name">İsme göre</option>
        <option value="email">E-posta</option>
        <option value="role">Rol</option>
      </select>

      <select
        value={order}
        onChange={(e) => update(sort, e.target.value)}
        className="
          bg-white/50 border border-white/70
          px-3 py-2 rounded-lg text-sm text-black
        "
      >
        <option value="asc">Artan</option>
        <option value="desc">Azalan</option>
      </select>

    </div>
  );
}
