"use client";

import { useState, useTransition } from "react";
import { createRole } from "./actions";

export function CreateRoleModal() {
  const [open, setOpen] = useState(false);
  const [errorMsg, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const PERMISSIONS = [
    "operator.view",
    "operator.update",
    "tasks.create",
    "tasks.assign",
    "tasks.close",
    "submissions.review",
    "templates.create",
    "templates.edit",
    "admin.access",
  ];

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
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white shadow hover:bg-indigo-700 transition"
      >
        Yeni Rol Ekle
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={() => !isPending && setOpen(false)}
          />

          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-6">
            <div className="w-full max-w-xl rounded-3xl bg-white/60 backdrop-blur-2xl p-8 shadow-xl border border-white/40">
              <h2 className="text-2xl font-semibold mb-4">Yeni Rol Oluştur</h2>

              {errorMsg && (
                <p className="text-sm text-red-600 mb-3">{errorMsg}</p>
              )}

              <form action={submit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Rol Adı</label>
                  <input
                    name="name"
                    required
                    className="mt-1 w-full p-3 rounded-xl border bg-white/60 backdrop-blur"
                    placeholder="Örn: Supervisor"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">İzinler</label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-3 bg-white/40 rounded-xl border">
                    {PERMISSIONS.map((p) => (
                      <label key={p} className="flex items-center gap-2">
                        <input type="checkbox" name="permissions" value={p} />
                        <span>{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-gray-200"
                    disabled={isPending}
                    onClick={() => setOpen(false)}
                  >
                    İptal
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2 rounded-xl bg-indigo-600 text-white"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
