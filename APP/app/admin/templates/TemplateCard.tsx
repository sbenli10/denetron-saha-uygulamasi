"use client";

import { useState, useTransition } from "react";
import type { TemplateRow } from "./actions";
import {
  toggleTemplateActiveAction,
  duplicateTemplateAction
} from "./actions";
import DeleteBtn from "./DeleteBtn";

export default function TemplateCard({ t }: { t: TemplateRow }) {
  const [isActive, setIsActive] = useState(t.is_active);
  const [isPending, startTransition] = useTransition();

  const meta = `${t.fields_count ?? 0} alan • ${
    isActive ? "Aktif" : "Pasif"
  }`;

  const toggleActive = () => {
    // ✅ Optimistic UI
    setIsActive(prev => !prev);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", t.id);

      try {
        await toggleTemplateActiveAction(fd);
      } catch {
        // ❌ rollback
        setIsActive(prev => !prev);
      }
    });
  };

  return (
    <div className="rounded-2xl bg-white/80 border border-black/10 backdrop-blur-xl p-4 shadow-sm">
      <div className="text-base font-medium text-[#1d1d1f]">
        {t.name}
      </div>

      <div className="mt-1 text-xs text-black/50">
        {meta}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {/* AKTİF / PASİF */}
        <button
          onClick={toggleActive}
          disabled={isPending}
          className={`
            px-3 py-1.5 text-xs font-medium rounded-full
            border border-black/10 transition
            ${
              isActive
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-white hover:bg-black/5"
            }
            ${isPending ? "opacity-60 cursor-wait" : ""}
          `}
        >
          {isActive ? "Pasifleştir" : "Aktifleştir"}
        </button>

        {/* DUPLICATE */}
        <form action={duplicateTemplateAction}>
          <input type="hidden" name="id" value={t.id} />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-black/10 hover:bg-black/5"
          >
            Kopyala
          </button>
        </form>

        {/* EDIT */}
        <a
          href={`/admin/templates/${t.id}/edit`}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700"
        >
          Düzenle
        </a>

        {/* DELETE */}
        <DeleteBtn id={t.id} name={t.name} />
      </div>
    </div>
  );
}
