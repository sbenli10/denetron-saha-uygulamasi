// APP/app/admin/settings/LogoUploader.tsx
"use client";

import { useEffect, useState } from "react";
import { uploadLogo } from "./logoUpload";

export default function LogoUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  // 🔑 PROP → STATE SYNC
  useEffect(() => {
    setPreview(value);
  }, [value]);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("[CLIENT] selected file:", file.name);

    const form = new FormData();
    form.append("file", file);

    const result = await uploadLogo(form);

    console.log("[CLIENT] upload result:", result);

    if (result.error) {
      alert(result.error);
      return;
    }

    setPreview(result.url!);
    onChange(result.url!);
  }

  return (
    <div className="space-y-3">
      <div className="w-28 h-28 rounded-xl bg-black/5 overflow-hidden flex items-center justify-center">
        {preview ? (
          <img
            src={preview}
            alt="Organizasyon Logosu"
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-black/40 text-sm">Logo Yok</span>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handle}
      />
    </div>
  );
}
