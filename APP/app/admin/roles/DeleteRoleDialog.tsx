"use client";

import { useState, useTransition } from "react";
import { deleteRole } from "./actions";

export default function DeleteRoleDialog({
  roleId,
  roleName,
}: {
  roleId: string;
  roleName: string;
}) {
  const [open, setOpen] = useState(false);
  const [errorMsg, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      try {
        setError("");
        await deleteRole(roleId);
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
        className="px-3 py-1.5 bg-red-500 text-white rounded-xl hover:bg-red-600"
      >
        Sil
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={() => !isPending && setOpen(false)}
          />

         <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-6">
            <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border shadow-xl">
              <h2 className="text-xl font-semibold mb-3">Rolü Sil</h2>

              <p className="text-sm mb-4">
                "{roleName}" rolünü silmek istediğinize emin misiniz?
              </p>

              {errorMsg && <p className="text-sm text-red-600 mb-3">{errorMsg}</p>}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded-xl"
                  disabled={isPending}
                  onClick={() => setOpen(false)}
                >
                  İptal
                </button>

                <button
                  onClick={() => setOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded-xl"                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
