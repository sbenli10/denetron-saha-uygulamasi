"use client";

import { ReactNode, useState, useMemo } from "react";
import WidgetContainer from "./WidgetContainer";
import { formatRelativeTime } from "@/lib/date-utils";
import { AnimatePresence, motion } from "framer-motion";

interface Item {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  time: string | Date;
  type?: "error" | "warning" | "action";
}

const PAGE_SIZES = [6, 10, 20, 50];

export default function ListWidget({
  title,
  description,
  items,
  emptyText = "Kayıt bulunamadı",
}: {
  title: string;
  description?: string;
  items: Item[];
  emptyText?: string;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "action">("all");

  // ---------------------------------------------------------
  // FILTER + SEARCH
  // ---------------------------------------------------------
  const filteredItems = useMemo(() => {
    return items
      .filter((i) => (filter === "all" ? true : i.type === filter))
      .filter((i) => {
        const q = search.toLowerCase();
        return (
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
        );
      });
  }, [items, search, filter]);

  // ---------------------------------------------------------
  // PAGINATION
  // ---------------------------------------------------------
  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const currentItems = filteredItems.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const goToPage = (pageNumber: number) => {
    const p = Math.max(1, Math.min(totalPages, pageNumber));
    setPage(p);
  };

  const hasItems = currentItems.length > 0;

  return (
    <WidgetContainer title={title} description={description}>
      {/* ---------------------- TOOLBAR ---------------------- */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">

        {/* Search */}
        <input
          type="text"
          placeholder="Ara..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="
            w-full sm:max-w-xs
            rounded-xl border border-border bg-card px-3 py-2 text-sm 
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
          "
        />

        {/* Filter Pills */}
        <div className="flex gap-2">
          {["all", "error", "warning", "action"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setFilter(t as any);
                setPage(1);
              }}
              className={`
                px-3 py-1.5 rounded-lg text-xs capitalize border
                transition backdrop-blur-sm
                ${
                  filter === t
                    ? "bg-primary/20 border-primary text-primary-foreground"
                    : "bg-card/40 border-border text-muted-foreground hover:bg-accent/40"
                }
              `}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Page size */}
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="
            rounded-xl border border-border bg-card px-3 py-2 text-sm 
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
          "
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} / sayfa
            </option>
          ))}
        </select>
      </div>

      {/* ------------------ EMPTY STATE ---------------------- */}
      {!hasItems ? (
        <div className="rounded-xl border border-dashed border-border bg-muted py-12 text-center">
          <span className="text-sm text-muted-foreground">{emptyText}</span>
        </div>
      ) : (
        <>
          {/* ------------------ LIST ---------------------- */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-xl">
            <div className="bg-muted/40 border-b border-border px-4 py-2 text-xs font-semibold text-muted-foreground">
              Latest activity
            </div>

            <AnimatePresence mode="popLayout">
              {currentItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="
                    flex items-start gap-3 px-4 py-3
                    hover:bg-accent/20 transition
                  "
                >
                  {/* Icon box */}
                  <div className="mt-0.5 shrink-0 rounded-xl border border-white/10 bg-card/60 backdrop-blur-xl p-2">
                    {item.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {item.title}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

                  <div className="shrink-0 whitespace-nowrap text-[10px] sm:text-xs text-muted-foreground">
                    {formatRelativeTime(item.time)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ------------------ PAGINATION ---------------------- */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Prev/Next */}
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => goToPage(page - 1)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs border 
                  transition backdrop-blur-sm 
                  ${
                    page === 1
                      ? "opacity-40 cursor-not-allowed bg-muted"
                      : "hover:bg-accent/40"
                  }
                `}
              >
                Önceki
              </button>

              <button
                disabled={page === totalPages}
                onClick={() => goToPage(page + 1)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs border 
                  transition backdrop-blur-sm
                  ${
                    page === totalPages
                      ? "opacity-40 cursor-not-allowed bg-muted"
                      : "hover:bg-accent/40"
                  }
                `}
              >
                Sonraki
              </button>
            </div>

            {/* Page indicator */}
            <div className="text-xs text-muted-foreground">
              Sayfa {page} / {totalPages}
            </div>

            {/* Go to page */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Git:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    goToPage(Number((e.target as any).value));
                  }
                }}
                className="
                  w-16 rounded-xl border border-border bg-card px-2 py-1 text-xs
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
                "
                placeholder="1"
              />
            </div>
          </div>
        </>
      )}
    </WidgetContainer>
  );
}
