// APP/app/admin/users/UsersSearchBar.tsx
"use client";

import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function UsersSearchBar() {
  const router = useRouter();
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get("q") ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (query.trim()) next.set("q", query);
      else next.delete("q");

      router.replace(`/admin/users?${next.toString()}`);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative w-full">
      <Search
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Üye ara…"
        className="
          w-full pl-10 pr-3 py-2 rounded-xl
          bg-white/50 border border-white/70
          text-sm text-black placeholder:text-black/40
          focus:ring-2 focus:ring-black/20
        "
      />
    </div>
  );
}
