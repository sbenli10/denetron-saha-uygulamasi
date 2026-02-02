// APP/app/components/signature/SignaturePad.tsx
"use client";

import { useRef, useState } from "react";

export default function SignaturePad({
  onSave,
}: {
  onSave: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  function start(e: any) {
    setDrawing(true);
    draw(e);
  }

  function end() {
    setDrawing(false);
    canvasRef.current?.getContext("2d")?.beginPath();
  }

  function draw(e: any) {
    if (!drawing) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const rect = canvasRef.current!.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    ctx.lineTo(
      e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left,
      e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(
      e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left,
      e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    );
  }

  function save() {
    const data = canvasRef.current!.toDataURL("image/png");
    onSave(data);
  }

  function clear() {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.clearRect(0, 0, 400, 200);
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="border rounded touch-none"
        onMouseDown={start}
        onMouseUp={end}
        onMouseMove={draw}
        onTouchStart={start}
        onTouchEnd={end}
        onTouchMove={draw}
      />
      <div className="flex gap-2">
        <button onClick={clear} className="px-3 py-1 border rounded">
          Temizle
        </button>
        <button onClick={save} className="px-3 py-1 bg-blue-600 text-white rounded">
          İmzayı Kaydet
        </button>
      </div>
    </div>
  );
}
