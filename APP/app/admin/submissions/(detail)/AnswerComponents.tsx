"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Paperclip,
} from "lucide-react";
import MediaLightbox from "./MediaLightbox";

/* ================= TYPES ================= */

export interface MediaItem {
  file_id: string;
  url: string;
  type?: string | null;
}

export interface SubmissionAnswer {
  label: string;
  value: string | boolean | null;
  critical?: boolean;
  media?: MediaItem[];
  findingText?: string | null;
  severity?: string | null;
}

/* ================= MAIN ================= */

export function AnswerCollapse({
  answer,
}: {
  answer: SubmissionAnswer;
}) {
  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{
    open: boolean;
    index: number;
  }>({ open: false, index: 0 });

  const media = answer.media ?? [];
  const isNonConformity =
    answer.value === false ||
    answer.value === "no" ||
    answer.severity === "critical";

  return (
    <div
      className={`rounded-2xl border bg-white transition ${
        isNonConformity
          ? "border-red-300"
          : "border-gray-200"
      }`}
    >
      {/* ───── HEADER ───── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isNonConformity ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}

            <h4 className="font-semibold text-gray-900">
              {answer.label}
            </h4>

            {answer.critical && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-semibold">
                <AlertTriangle className="w-3 h-3" />
                Kritik
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600">
            {renderResultText(answer.value)}
          </div>
        </div>

        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 mt-1" />
        )}
      </button>

      {/* ───── BODY ───── */}
      {open && (
        <div className="px-5 pb-5 space-y-6">
          {/* FINDING */}
          {answer.findingText && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700 mb-1">
                Denetçi / Operatör Bulgusu
              </p>
              <p className="text-sm text-red-800 whitespace-pre-line">
                {answer.findingText}
              </p>
            </div>
          )}

          {/* MEDIA */}
          {media.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                <Paperclip className="w-4 h-4" />
                Kanıtlar ({media.length})
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {media.map((m, i) => (
                  <MediaThumb
                    key={m.file_id}
                    src={m.url}
                    onClick={() =>
                      setLightbox({
                        open: true,
                        index: i,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───── LIGHTBOX ───── */}
      <MediaLightbox
        open={lightbox.open}
        media={media.map(m => m.url)}
        initialIndex={lightbox.index}
        onClose={() =>
          setLightbox({ open: false, index: 0 })
        }
      />
    </div>
  );
}

/* ================= HELPERS ================= */

function renderResultText(
  value: string | boolean | null
) {
  if (typeof value === "boolean") {
    return value
      ? "Uygun"
      : "Uygunsuz";
  }

  if (typeof value === "string") {
    const v = value.toLowerCase();
    if (v === "yes" || v === "evet")
      return "Uygun";
    if (v === "no" || v === "hayır")
      return "Uygunsuz";
  }

  return "—";
}

/* ================= MEDIA ================= */

function isVideo(src: string) {
  return /\.(mp4|webm)$/i.test(src);
}

function MediaThumb({
  src,
  onClick,
}: {
  src: string;
  onClick: () => void;
}) {
  const video = isVideo(src);

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer rounded-xl overflow-hidden border bg-gray-100 hover:ring-2 hover:ring-indigo-500 transition"
    >
      {video ? (
        <video
          src={src}
          muted
          playsInline
          className="w-full aspect-video object-cover"
        />
      ) : (
        <img
          src={src}
          className="w-full aspect-video object-cover"
        />
      )}

      {video && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded">
            Video
          </span>
        </div>
      )}
    </div>
  );
}
