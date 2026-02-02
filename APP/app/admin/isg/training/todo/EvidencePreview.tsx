"use client";

/* ================= TYPES ================= */

type Evidence = {
  file_url: string;
  file_type: string;
};

/* ================= HELPERS ================= */

/**
 * Supabase Storage içindeki dosya için public URL üretir
 * Bucket adı: evidences
 */
function getPublicUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";

  return `${base}/storage/v1/object/public/evidences/${path}`;
}

/* ================= COMPONENT ================= */

export function EvidencePreview({
  evidences,
}: {
  evidences: Evidence[];
}) {
  if (!evidences || evidences.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Yüklenmiş kanıt bulunmamaktadır.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {evidences.map((e, idx) => {
        const url = getPublicUrl(e.file_url);

        /* IMAGE PREVIEW */
        if (e.file_type?.startsWith("image/")) {
          return (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-lg border bg-white hover:shadow transition"
            >
              <img
                src={url}
                alt="Kanıt"
                className="h-32 w-full object-cover"
              />
              <div className="px-2 py-1 text-xs text-gray-500 text-center">
                Görüntüyü aç
              </div>
            </a>
          );
        }

        /* PDF PREVIEW */
        if (e.file_type === "application/pdf") {
          return (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center h-32 rounded-lg border bg-gray-50 hover:bg-gray-100 transition text-sm text-gray-700"
            >
              <span className="text-3xl">📄</span>
              <span className="mt-1">PDF’i Aç</span>
            </a>
          );
        }

        /* FALLBACK */
        return (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center h-32 rounded-lg border bg-gray-50 hover:bg-gray-100 transition text-sm text-gray-700"
          >
            <span className="text-3xl">📎</span>
            <span className="mt-1">Dosyayı Aç</span>
          </a>
        );
      })}
    </div>
  );
}
