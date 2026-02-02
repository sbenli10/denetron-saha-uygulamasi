"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

export function VideoThumb({
  src,
  onClick,
}: {
  src: string;
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      const d = v.duration;
      if (!isNaN(d)) {
        const m = Math.floor(d / 60);
        const s = Math.floor(d % 60)
          .toString()
          .padStart(2, "0");
        setDuration(`${m}:${s}`);
      }
    };

    v.addEventListener("loadedmetadata", onLoaded);
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, []);

  return (
    <div
      onClick={onClick}
      className="relative aspect-video rounded-xl overflow-hidden cursor-pointer shadow"
    >
      <video
        ref={videoRef}
        src={src}
        muted
        preload="metadata"
        className="w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <Play className="text-white" size={32} />
      </div>

      {duration && (
        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
          {duration}
        </span>
      )}
    </div>
  );
}
