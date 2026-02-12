"use client";

import { useState, useTransition } from "react";
import { createRole } from "./actions";

export function CreateRoleModal() {
  const [open, setOpen] = useState(false);
  const [errorMsg, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      setError("");
      try {
        await createRole(formData);
        setOpen(false);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          inline-flex items-center justify-center
          px-5 py-2.5 rounded-2xl
          bg-indigo-600 text-white font-semibold
          shadow-sm hover:bg-indigo-700
          active:scale-[0.99] transition
          focus:outline-none focus:ring-2 focus:ring-indigo-500/40
          whitespace-nowrap
        "
      >
        Yeni Rol Ekle
      </button>

      {open && (
        <>
          {/* BACKDROP */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={() => !isPending && setOpen(false)}
          />

          {/* MODAL WRAP (mobile: bottom-sheet, desktop: center) */}
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-6">
            <div
              className="
                w-full max-w-xl
                rounded-3xl
                bg-white/70 backdrop-blur-2xl
                border border-white/40
                shadow-xl
                overflow-hidden
              "
            >
              {/* HEADER */}
              <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-4 border-b border-black/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[18px] sm:text-[22px] font-semibold text-black">
                      Yeni Rol Oluştur
                    </h2>
                    <p className="mt-1 text-[12px] sm:text-[13px] text-black/55">
                      Rol adını girin ve kaydedin.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => !isPending && setOpen(false)}
                    className="
                      h-10 w-10 rounded-2xl
                      border border-black/10 bg-white/60
                      hover:bg-white/80
                      flex items-center justify-center
                      transition
                      disabled:opacity-60 disabled:cursor-not-allowed
                    "
                    disabled={isPending}
                    aria-label="Kapat"
                    title="Kapat"
                  >
                    <span className="text-black/70 text-lg leading-none">×</span>
                  </button>
                </div>

                {errorMsg && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <div className="text-[13px] font-semibold text-red-700">
                      İşlem başarısız
                    </div>
                    <div className="mt-0.5 text-[12px] text-red-700/90">
                      {errorMsg}
                    </div>
                  </div>
                )}
              </div>

              {/* BODY */}
              <form action={submit} className="px-5 sm:px-7 py-5 sm:py-6 space-y-5">
                <div>
                  <label className="text-[12px] font-semibold text-black/70">
                    Rol Adı
                  </label>
                  <input
                    name="name"
                    required
                    autoFocus
                    placeholder="Örn: Supervisor"
                    className="
                      mt-2 w-full
                      h-12
                      rounded-2xl
                      border border-black/10
                      bg-white/70
                      px-4
                      text-[14px] text-black
                      placeholder:text-black/40
                      outline-none
                      focus:ring-2 focus:ring-indigo-500/25
                      focus:border-indigo-500/30
                      transition
                      disabled:opacity-70
                    "
                    disabled={isPending}
                  />
                </div>

                {/* FOOTER ACTIONS */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    className="
                      w-full sm:w-auto
                      h-12 px-5
                      rounded-2xl
                      border border-black/10
                      bg-white/60 text-black/80
                      font-semibold
                      hover:bg-white/80
                      transition
                      disabled:opacity-60 disabled:cursor-not-allowed
                    "
                    disabled={isPending}
                    onClick={() => setOpen(false)}
                  >
                    İptal
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="
                      w-full sm:w-auto
                      h-12 px-6
                      rounded-2xl
                      bg-indigo-600 text-white
                      font-semibold
                      shadow-sm
                      hover:bg-indigo-700
                      active:scale-[0.99]
                      transition
                      disabled:opacity-70 disabled:cursor-not-allowed
                    "
                  >
                    {isPending ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                </div>

                {/* MOBILE SAFE AREA (opsiyonel) */}
                <div className="sm:hidden h-[env(safe-area-inset-bottom)]" />
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
