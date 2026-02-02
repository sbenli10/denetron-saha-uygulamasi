//APP\app\components\operator\CameraView.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import {
  Camera,
  X,
  Zap,
  ZapOff,
  Grid,
  Video,
  Square,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Box } from "@/types/vision";

type GridMode = "none" | "thirds";
type FacingMode = "user" | "environment";

type AIStatus =
  | "idle"        // hiçbir şey yok
  | "capturing"   // frame alınıyor
  | "analyzing"   // backend / gemini çalışıyor
  | "success"     // sonuç geldi
  | "error";      // hata / offline


interface CameraViewProps {
  onCapture: (blob: Blob, type: "photo" | "video") => void;
  onClose: () => void;

  onAnalyzeFrame?: (imageBase64: string) => void;

  overlay?: React.ReactNode;

  // 🔽 SADECE GÖSTERİM İÇİN
  aiStatus?: "idle" | "analyzing" | "success" | "error";
  aiMessage?: string | null;
}


const isIOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

export default function CameraView({
  onCapture,
  onClose,
  onAnalyzeFrame,
  overlay,
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [drawStart, setDrawStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [drawBox, setDrawBox] = useState<Box | null>(null);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [grid, setGrid] = useState<GridMode>("none");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] =
    useState<FacingMode>("environment");
  const [permissionError, setPermissionError] = useState<string | null>(
    null
  );
  const [qualityError, setQualityError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [manualDrawMode, setManualDrawMode] = useState(false);

  useEffect(() => {
  // 📵 Mobile scroll tamamen kapalı
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";

  return () => {
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
  };
}, []);

  
  /* ================= CAMERA START + FALLBACK ================= */
  async function startCamera(mode: FacingMode = facingMode) {
    try {
      setPermissionError(null);
      setQualityError(null);
      setIsStarting(true);
      cleanup();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;

      if (isIOS) {
        video.setAttribute("playsinline", "true");
        await new Promise(r => setTimeout(r, 100));
      }

      await video.play();
      setReady(true);
      setFacingMode(mode);

      const track: any = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.();
      setTorchSupported(!!caps?.torch);
    } catch (err: any) {
      // 🔄 FALLBACK: arka yoksa öne geç
      if (
        mode === "environment" &&
        (err.name === "OverconstrainedError" ||
          err.name === "NotFoundError")
      ) {
        return startCamera("user");
      }

      console.error("Camera error:", err);
      setPermissionError(
        "Kamera bulunamadı veya erişim engellendi.\n\n" +
          "Tarayıcı ayarlarından kamera izni vermelisiniz."
      );
    } finally {
      setIsStarting(false);
    }
  }


  function getVideoRelativeBox(video: HTMLVideoElement): Box {
  const rect = video.getBoundingClientRect();

  return {
    x: rect.width * 0.3,
    y: rect.height * 0.25,
    w: rect.width * 0.4,
    h: rect.height * 0.4,
  };
}

function denormalizeBox(box: Box, video: HTMLVideoElement): Box {
  return {
    x: box.x * video.clientWidth,
    y: box.y * video.clientHeight,
    w: box.w * video.clientWidth,
    h: box.h * video.clientHeight,
  };
}


  function captureFrameForAI() {
    if (!videoRef.current || !onAnalyzeFrame) return;

    const video = videoRef.current;
    if (video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const base64 = canvas
      .toDataURL("image/jpeg", 0.6)
      .split(",")[1];

    onAnalyzeFrame(base64); // 🔥 BURADA BİTER
  }



  /* ================= CLEANUP ================= */
  function cleanup() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setReady(false);
    setRecording(false);
    setTorchOn(false);
  }

  /* ================= QUALITY CHECK ================= */
  function checkPhotoQuality(
    canvas: HTMLCanvasElement
  ): string | null {
    const ctx = canvas.getContext("2d");
    if (!ctx) return "Fotoğraf analiz edilemedi.";

    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;

    let brightness = 0;
    let diffSum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      brightness += lum;

      if (i > 4) {
        const prevLum =
          0.2126 * data[i - 4] +
          0.7152 * data[i - 3] +
          0.0722 * data[i - 2];
        diffSum += Math.abs(lum - prevLum);
      }
    }

    brightness /= data.length / 4;
    diffSum /= data.length / 4;

    // if (brightness < 40) return "Fotoğraf çok karanlık.";
    // if (brightness > 230) return "Fotoğraf aşırı aydınlık.";
    // if (diffSum < 8) return "Fotoğraf bulanık görünüyor.";

    return null;
  }

  /* ================= PHOTO ================= */
  function capturePhoto() {
    if (!videoRef.current || !ready) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const qualityIssue = checkPhotoQuality(canvas);
    if (qualityIssue) {
      setQualityError(qualityIssue);
      return;
    }

    canvas.toBlob(
      blob => {
        if (!blob) return;
        onCapture(blob, "photo");
        cleanup();
        onClose();
      },
      "image/jpeg",
      0.9
    );
  }

  /* ================= VIDEO ================= */
  function startRecording() {
    if (!streamRef.current || recording) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);

    recorder.ondataavailable = e =>
      e.data.size && chunksRef.current.push(e.data);

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: "video/webm",
      });
      onCapture(blob, "video");
      cleanup();
      onClose();
    };

    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  /* ================= TORCH ================= */
  async function toggleTorch() {
    if (!streamRef.current || !torchSupported) return;

    const track: any = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(v => !v);
    } catch {}
  }

/* ================= UI ================= */
return (
  <div className="fixed inset-0 z-[1000] bg-black flex">

    {/* ================= CAMERA AREA ================= */}
    <div className="relative flex-1 overflow-hidden touch-none">
      {/* VIDEO */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />
      {/* 🧠 OVERLAY (AI risk boxes, status, result vs – DIŞARDAN GELİR) */}
      {overlay && ready && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          {overlay}
        </div>
      )}

      {/* ================= START / ERROR ================= */}
      {!ready && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black text-white">
          {permissionError && (
            <p className="mb-4 text-center text-sm px-6 whitespace-pre-line text-red-300">
              {permissionError}
            </p>
          )}

          <button
            disabled={isStarting}
            onClick={() => startCamera()}
            className="
              px-6 py-3 rounded-xl
              bg-white text-black font-semibold
              disabled:opacity-60
            "
          >
            {isStarting ? "Kamera Açılıyor…" : "Kamerayı Aç"}
          </button>
        </div>
      )}

      {/* ================= QUALITY ERROR ================= */}
      {qualityError && (
        <div className="
          absolute bottom-36 left-1/2 -translate-x-1/2 z-40
          bg-black/80 text-white px-4 py-2 rounded-xl
          flex items-center gap-2 text-sm backdrop-blur
        ">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          {qualityError}
        </div>
      )}

      {/* ================= GRID ================= */}
      {ready && grid === "thirds" && (
        <div className="absolute inset-0 z-20 pointer-events-none grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/20" />
          ))}
        </div>
      )}

      {/* ================= TOP BAR ================= */}
      <div
        className="
          absolute top-0 inset-x-0 z-40
          flex justify-between items-center
          p-4 pt-[env(safe-area-inset-top)]
        "
      >
        <button
          onClick={() => {
            cleanup();
            onClose();
          }}
          className="
            h-10 w-10 rounded-full
            bg-black/60 text-white
            flex items-center justify-center
            backdrop-blur
          "
        >
          <X />
        </button>

        {ready && (
          <div className="flex gap-2">
            <button
              onClick={() =>
                startCamera(
                  facingMode === "environment" ? "user" : "environment"
                )
              }
              className="h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <RotateCcw />
            </button>

            {torchSupported && (
              <button
                onClick={toggleTorch}
                className="h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                {torchOn ? <Zap /> : <ZapOff />}
              </button>
            )}

            <button
              onClick={() => setGrid(g => (g === "none" ? "thirds" : "none"))}
              className="h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <Grid />
            </button>
          </div>
        )}
      </div>

      {/* ================= BOTTOM CONTROLS (MOBILE / TABLET) ================= */}
      {ready && (
        <div
          className="
            absolute bottom-0 inset-x-0 z-40
            p-4 pb-[env(safe-area-inset-bottom)]
            grid grid-cols-3 sm:grid-cols-4 gap-4
            lg:hidden
          "
        >
          {/* PHOTO */}
          <button
            onClick={capturePhoto}
            className="
              h-14 w-14 sm:h-16 sm:w-16
              rounded-full bg-white
              flex items-center justify-center
            "
          >
            <Camera className="text-black" />
          </button>

          {/* VIDEO */}
          {!recording ? (
            <button
              onClick={startRecording}
              className="
                h-14 w-14 sm:h-16 sm:w-16
                rounded-full bg-red-600
                flex items-center justify-center
                active:scale-95
              "
            >
              <Video className="text-white" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="
                h-14 w-14 sm:h-16 sm:w-16
                rounded-full bg-red-700
                flex items-center justify-center
                animate-pulse
              "
            >
              <Square className="text-white" />
            </button>
          )}

          {/* 🤖 AI ANALYZE (STATE BİLMEZ) */}
          {onAnalyzeFrame && (
            <button
              onClick={captureFrameForAI}
              className="
                col-span-1 sm:col-span-2
                h-14 sm:h-16
                px-4 sm:px-6
                rounded-full
                bg-amber-500 text-black
                font-semibold
                shadow-lg
                active:scale-95
              "
            >
              AI Analiz Et
            </button>
          )}
        </div>
      )}
    </div>

    {/* ================= DESKTOP SIDE PANEL ================= */}
    <aside
      className="
        hidden lg:flex w-80
        bg-gradient-to-b from-black/90 to-black/70
        border-l border-white/10
        p-5 z-40
        backdrop-blur
      "
    >
      <div className="flex flex-col h-full text-white">

        <div className="mb-4">
          <p className="text-sm uppercase tracking-wide text-white/60">
            Kamera Kontrolleri
          </p>
          <h3 className="text-lg font-semibold">
            Canlı AI Kamera
          </h3>
        </div>

        {onAnalyzeFrame && (
          <button
            onClick={captureFrameForAI}
            className="
              h-12 rounded-xl
              bg-amber-500 text-black
              font-semibold
              shadow-lg
              hover:bg-amber-400
              active:scale-[0.98]
            "
          >
            AI Analiz Et
          </button>
        )}

        <div className="my-6 h-px bg-white/10" />

        <div className="flex flex-col gap-3 text-sm text-white/80">
          <div>• Adaptif çözünürlük</div>
          <div>• Canlı risk overlay</div>
          <div>• Torch / Kamera yönü</div>
        </div>

        <div className="mt-auto pt-6 text-[11px] text-white/40">
          Kamera verisi yerel işlenir.  
          AI analizleri isteğe bağlıdır.
        </div>
      </div>
    </aside>
  </div>
);
}