"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();

  const initial = params.get("query") ?? "";
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const t = setTimeout(() => {
      const newParams = new URLSearchParams(params.toString());

      if (value) newParams.set("query", value);
      else newParams.delete("query");

      newParams.set("page", "1");

      router.push(`?${newParams.toString()}`);
    }, 300);

    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="flex items-center gap-2 px-4 h-11 rounded-2xl bg-white/40 backdrop-blur-xl ring-1 ring-black/10 shadow-sm">
      <Search className="w-4 h-4 text-[#5F6368]" />
      <input
        placeholder="Operatör, şablon veya açıklama ara…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-transparent text-sm text-[#2C2F3A] placeholder:text-[#8E93A6] outline-none"
      />
    </div>
  );
}
