"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();

  const current = params.get("severity") ?? "";

  function updateFilter(value: string) {
    const newParams = new URLSearchParams(params.toString());

    if (value) newParams.set("severity", value);
    else newParams.delete("severity");

    newParams.set("page", "1");

    router.push(`?${newParams.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => updateFilter(e.target.value)}
      className="px-3 py-2 rounded-xl bg-white/40 backdrop-blur-xl ring-1 ring-black/10 text-sm text-[#2C2F3A]"
    >
      <option value="">Tüm Şiddetler</option>
      <option value="low">Düşük</option>
      <option value="medium">Orta</option>
      <option value="high">Yüksek</option>
    </select>
  );
}
