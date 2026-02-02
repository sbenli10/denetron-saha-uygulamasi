// app/admin/templates/DeleteBtn.tsx
"use client";

import { useRef } from "react";
import { deleteTemplateAction } from "./actions";

export default function DeleteTemplateButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const message =
      `"${name}" şablonunu silmek üzeresiniz.\n\n` +
      "Bu şablona ait atanmış görevler silinecektir.\n" +
      "Geçmişte tamamlanmış görevler ve raporlar korunacaktır.\n\n" +
      "Devam etmek istiyor musunuz?";

    if (!confirm(message)) {
      e.preventDefault();
    }
  }

  return (
    <form
      ref={formRef}
      action={deleteTemplateAction}
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        className="rounded-lg border border-amber-500/50 px-3 py-1.5 text-sm
                   text-amber-600 hover:bg-amber-500/10"
      >
        Sil
      </button>
    </form>
  );
}
