"use client";

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  searchParams: Record<string, string | undefined>;
}

export default function Pagination({
  page,
  total,
  pageSize,
  searchParams,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildLink(newPage: number) {
    const params = new URLSearchParams(searchParams as any);
    params.set("page", String(newPage));
    return `?${params.toString()}`;
  }

  return (
    <div className="flex justify-center items-center gap-3 py-6">
      <a
        href={buildLink(page - 1)}
        className={`px-4 py-2 rounded-xl bg-white/50 backdrop-blur-xl ring-1 ring-black/10 text-[#3A3F58] ${
          page <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-white/80"
        }`}
      >
        Önceki
      </a>

      <span className="text-[#4D526A] text-sm">
        Sayfa {page} / {totalPages}
      </span>

      <a
        href={buildLink(page + 1)}
        className={`px-4 py-2 rounded-xl bg-white/50 backdrop-blur-xl ring-1 ring-black/10 text-[#3A3F58] ${
          page >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-white/80"
        }`}
      >
        Sonraki
      </a>
    </div>
  );
}
