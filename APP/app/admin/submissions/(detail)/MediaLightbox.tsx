"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  media: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function MediaLightbox({
  open,
  media,
  initialIndex,
  onClose,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  if (!open) return null;

  const current = media[index];

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null) return;
    const diff = e.changedTouches[0].clientX - startX.current;

    if (diff > 60 && index > 0) setIndex(i => i - 1);
    if (diff < -60 && index < media.length - 1) setIndex(i => i + 1);

    startX.current = null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* CLOSE */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white z-50"
      >
        <X size={28} />
      </button>

      {/* LEFT */}
      {index > 0 && (
        <button
          onClick={e => {
            e.stopPropagation();
            setIndex(i => i - 1);
          }}
          className="absolute left-4 text-white z-40"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* RIGHT */}
      {index < media.length - 1 && (
        <button
          onClick={e => {
            e.stopPropagation();
            setIndex(i => i + 1);
          }}
          className="absolute right-4 text-white z-40"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* MEDIA */}
      <div
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="max-w-[100vw] max-h-[100dvh] flex items-center justify-center"
      >
        {isVideo(current) ? (
          <video
            src={current}
            controls
            autoPlay
            playsInline
            className="max-w-[95vw] max-h-[90dvh] rounded-xl"
          />
        ) : (
          <img
            src={current}
            className="max-w-[95vw] max-h-[90dvh] object-contain rounded-xl"
            style={{ touchAction: "pinch-zoom" }}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

function isVideo(src: string) {
  return /\.(mp4|webm)$/i.test(src);
}
