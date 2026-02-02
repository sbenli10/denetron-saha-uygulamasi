//APP\app\components\operator\InspectionFlow.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Mic,
} from "lucide-react";
import CameraView from "./CameraView";
import { analyzeQuality } from "./PhotoQualityCheck";
import { useRouter } from "next/navigation";

/* ================= TYPES ================= */

export type AnswerRecord = {
  questionId: string;
  questionText: string;
  answer: "yes" | "no";
  findingText?: string;

  // 🔵 HENÜZ FILE_ID YOK
  media?: {
    blob: Blob;
    type: "photo" | "video";
  }[];
};

export type SubmissionAnswer = {
  questionId: string;
  questionText: string;
  answer: "yes" | "no";
  findingText?: string;

  media?: {
    file_id: string;
    type: "photo" | "video";
  }[];
};



export type InspectionQuestion = {
  id: string;
  text: string;
};

type MediaItem = {
  blob: Blob;
  type: "photo" | "video";
  preview: string;
  url?: string; // 🔥 UPLOAD SONRASI DOLACAK
};



interface InspectionFlowProps {
  questions: InspectionQuestion[];
  onComplete: (answers: AnswerRecord[]) => void;
  orgId: string;
  taskId: string;
}

/* ================= UPLOAD HELPER ================= */
async function uploadMedia({
  blob,
  type,
  orgId,
  taskId,
  submissionId,
  questionId,
}: {
  blob: Blob;
  type: "photo" | "video";
  orgId: string;
  taskId: string;
  submissionId: string;
  questionId: string;
}) {
  console.group("⬆️ uploadMedia()");
  console.log("questionId:", questionId);
  console.log("submissionId:", submissionId);
  console.log("taskId:", taskId);
  console.log("orgId:", orgId);
  console.log("type:", type);
  console.log("blob.size:", blob.size);
  console.log("blob.type:", blob.type);
  console.groupEnd();

  const form = new FormData();
  form.append("file", blob);
  form.append("org_id", orgId);
  form.append("task_id", taskId);
  form.append("submission_id", submissionId);
  form.append("question_id", questionId);

  const res = await fetch("/api/operator/uploads/photo", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    console.error("❌ uploadMedia failed:", err);
    throw new Error("Medya yüklenemedi");
  }

  const data = await res.json();
  console.log("✅ uploadMedia response:", data);
  return data;
}


/* ================= COMPLETE SUBMISSION ================= */
async function completeTask({
  taskId,
  answers,
  description,
}: {
  taskId: string;
  answers: AnswerRecord[];
  description?: string | null;
}): Promise<{ submissionId: string }> {
  console.group("📡 [COMPLETE TASK] REQUEST");

  console.log("🆔 taskId:", taskId);
  console.log("📝 description:", description);

  console.log(
    "📦 answers payload (SUMMARY):",
    answers.map((a, i) => ({
      index: i,
      questionId: a.questionId,
      answer: a.answer,
      mediaCount: a.media?.length ?? 0,
      hasBlob: a.media?.some(m => m.blob instanceof Blob),
    }))
  );

  console.log("📤 FULL PAYLOAD JSON:", {
    answers,
    description: description ?? null,
  });

  console.groupEnd();

  const res = await fetch(
    `/api/operator/assigned-tasks/${taskId}/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers,
        description: description ?? null,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    console.error("❌ [COMPLETE TASK] FAILED", {
      status: res.status,
      error: err,
    });
    throw new Error("Görev tamamlanamadı");
  }

  const data = await res.json();

  console.log("✅ [COMPLETE TASK] SUCCESS", data);

  return data; // 👉 { submissionId }
}



/* ================= COMPONENT ================= */

export default function InspectionFlow({
  questions,
  onComplete,
  orgId,
  taskId,
}: InspectionFlowProps) {
// FLOW
const [step, setStep] = useState(0);
const [answers, setAnswers] = useState<AnswerRecord[]>([]);

// FINDING
const [showFinding, setShowFinding] = useState(false);
const [findingText, setFindingText] = useState("");
const [error, setError] = useState<string | null>(null);

// MEDIA (TEK KAYNAK)
const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
const hasPhoto = mediaItems.some(m => m.type === "photo");
const [pillOpen, setPillOpen] = useState(false);
const [dictating, setDictating] = useState(false);
const [completed, setCompleted] = useState(false);
const [submissionId, setSubmissionId] = useState<string | null>(null);
const router = useRouter();
const imageBlobs = mediaItems
  .filter(m => m.type === "photo")
  .map(m => m.blob);

// UPLOAD
const [uploadState, setUploadState] = useState<
  "idle" | "uploading" | "success" | "error"
>("idle");
const [uploadMessage, setUploadMessage] = useState<string | null>(null);

// CAMERA (TEK STATE – ÖNEMLİ)
const [cameraOpen, setCameraOpen] = useState(false);

// UI / UX
const [showPhotoPicker, setShowPhotoPicker] = useState(false);
const [keyboardOffset, setKeyboardOffset] = useState(0);
const [aiLoading, setAiLoading] = useState(false);

// REFS
const sheetRef = useRef<HTMLDivElement>(null);
const startY = useRef<number | null>(null);
const lockRef = useRef(false);
const fileInputRef = useRef<HTMLInputElement>(null);
const imageUrls = mediaItems
  .filter((m): m is MediaItem & { url: string } =>
    m.type === "photo" && typeof m.url === "string"
  )
  .map(m => m.url);

// DERIVED
const isDirty =
  findingText.trim().length > 0 || mediaItems.length > 0;

const current = questions[step];
const isLastStep = step === questions.length - 1;
const allAnswered = answers.length === questions.length;

function CompletionScreen({
  submissionId,
  onGoHome,
  onViewDetail,
}: {
  submissionId: string | null;
  onGoHome: () => void;
  onViewDetail: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      <h2 className="text-2xl font-semibold mb-2">
        Denetim Başarıyla Tamamlandı
      </h2>

      <p className="text-sm text-neutral-500 mb-8">
        Denetim kayıt altına alındı ve yöneticiye iletildi.
      </p>

      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={onViewDetail}
          className="h-12 rounded-xl bg-primary text-white font-semibold"
        >
          Denetim Detayını Gör
        </button>

        <button
          onClick={onGoHome}
          className="h-12 rounded-xl bg-neutral-100 text-neutral-800"
        >
          Görevlere Dön
        </button>
      </div>
    </div>
  );
}




if (!current) return null;

  /* ================= HELPERS ================= */
function safePush(record: AnswerRecord) {
  if (lockRef.current) return;
  lockRef.current = true;

  setAnswers(prev => [...prev, record]);

  setTimeout(() => {
    setStep(s => Math.min(s + 1, questions.length - 1));
    lockRef.current = false;
  }, 300);
}
  function handleYes() {
    safePush({
      questionId: current.id,
      questionText: current.text,
      answer: "yes",
    });
  }
  function handleNo() {
    navigator.vibrate?.(10);
    setShowFinding(true);
  }

  function haptic(type: "light" | "medium" = "light") {
  if (navigator.vibrate) {
    navigator.vibrate(type === "light" ? 10 : 20);
  }
}

  /* ================= BOTTOM SHEET DRAG ================= */
  function handleTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startY.current == null || !sheetRef.current) return;

    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (startY.current == null || !sheetRef.current) return;

    const diff = e.changedTouches[0].clientY - startY.current;
    sheetRef.current.style.transform = "";
    startY.current = null;

    if (diff > 120) {
      attemptCloseFinding();
    }
  }

function attemptCloseFinding() {
  if (!isDirty) {
    setShowFinding(false);
    return;
  }

  navigator.vibrate?.(20);

  const ok = window.confirm(
    "Kaydedilmemiş değişiklikler var.\nÇıkarsanız bilgiler silinecek."
  );

  if (ok) {
    mediaItems.forEach(m => URL.revokeObjectURL(m.preview));
    setMediaItems([]);
    setFindingText("");
    setError(null);
    setShowFinding(false);
  }
}

  /* ================= DICTATION ================= */
  function startDictation() {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert("Sesli dikte desteklenmiyor.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "tr-TR";
    recognition.interimResults = false;

    recognition.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setFindingText(prev =>
          prev ? `${prev} ${transcript}` : transcript
        );
      }
    };

    recognition.start();
  }

  /* ================= HISTORY HANDLING ================= */
    useEffect(() => {
      if (!showFinding) return;

      const viewport = window.visualViewport;
      if (!viewport) return;

      const onResize = () => {
        const offset =
          window.innerHeight - viewport.height - viewport.offsetTop;
        setKeyboardOffset(offset > 0 ? offset : 0);
      };

      viewport.addEventListener("resize", onResize);
      viewport.addEventListener("scroll", onResize);

      onResize();

      return () => {
        viewport.removeEventListener("resize", onResize);
        viewport.removeEventListener("scroll", onResize);
        setKeyboardOffset(0);
      };
    }, [showFinding]);


    function handleCapture(blob: Blob, type: "photo" | "video") {
      const fixedBlob =
        type === "photo"
          ? new Blob([blob], { type: "image/jpeg" })
          : new Blob([blob], { type: blob.type || "video/webm" });

      setMediaItems(prev => [
        ...prev,
        {
          blob: fixedBlob,
          type,
          preview: URL.createObjectURL(fixedBlob),
        },
      ]);
    }

/* ================= FINDING SAVE ================= */
async function handleSaveFinding() {
  console.group("💾 [FINDING SAVE] START");

  setError(null);

  console.log("🧩 Question", {
    id: current.id,
    text: current.text,
  });

  console.log("📝 Finding text:", findingText);

  console.log(
    "📸 Media items:",
    mediaItems.map((m, i) => ({
      index: i,
      type: m.type,
      size: m.blob?.size,
      mime: m.blob?.type,
      isBlob: m.blob instanceof Blob,
    }))
  );

  if (!findingText.trim()) {
    console.warn("⚠️ Finding text boş");
    setError("Açıklama zorunludur.");
    console.groupEnd();
    return;
  }

  const record = {
    questionId: current.id,
    questionText: current.text,
    answer: "no" as const,
    findingText,
    media: mediaItems.map(m => ({
      blob: m.blob,
      type: m.type,
    })),
  };

  console.log("📦 AnswerRecord PUSH EDİLİYOR:", {
    questionId: record.questionId,
    answer: record.answer,
    mediaCount: record.media?.length ?? 0,
    hasBlob: record.media?.some(m => m.blob instanceof Blob),
  });

  // 🔥 SADECE STATE'E PUSH (UPLOAD YOK)
  safePush(record);

  console.log("🧹 UI resetleniyor");

  mediaItems.forEach(m => URL.revokeObjectURL(m.preview));
  setMediaItems([]);
  setFindingText("");
  setShowFinding(false);

  console.groupEnd();
}


    async function handleFinalSubmit() {
  try {
    console.group("🚀 FINAL SUBMIT START");

    setUploadState("uploading");

    /* ================= 1️⃣ LOG RAW ANSWERS ================= */
    console.log("📦 RAW ANSWERS (WITH BLOB)");
    answers.forEach((a, i) => {
      console.log(`Q${i}`, {
        questionId: a.questionId,
        mediaCount: a.media?.length ?? 0,
        hasBlob: a.media?.some(m => m.blob instanceof Blob),
      });
    });

    /* ================= 2️⃣ SUBMISSION OLUŞTUR (BLOB TEMİZ) ================= */
    const cleanAnswers = answers.map(a => ({
      questionId: a.questionId,
      questionText: a.questionText,
      answer: a.answer,
      findingText: a.findingText ?? null,
      media: [], // 🔥 MUTLAKA BOŞ
    }));

    console.log("📤 COMPLETE TASK PAYLOAD (NO BLOB)", cleanAnswers);

    const res = await completeTask({
      taskId,
      answers: cleanAnswers as any,
      description: null,
    });

    const submissionId = res.submissionId;
    console.log("🧾 SUBMISSION CREATED", submissionId);

    /* ================= 3️⃣ MEDYA UPLOAD ================= */
    for (const a of answers) {
      if (!a.media || a.media.length === 0) continue;

      console.group(`📸 UPLOAD MEDIA FOR ${a.questionId}`);

      for (const m of a.media) {
        console.log("⬆️ uploading", {
          questionId: a.questionId,
          type: m.type,
          size: m.blob.size,
        });

        const uploadRes = await uploadMedia({
          blob: m.blob,
          type: m.type,
          orgId,
          taskId,
          submissionId,
          questionId: a.questionId,
        });

        console.log("✅ upload result", uploadRes);
      }

      console.groupEnd();
    }

    console.groupEnd();

    setSubmissionId(submissionId);
    setCompleted(true);
    setUploadState("success");
  } catch (e) {
    console.error("❌ FINAL SUBMIT FAILED", e);
    setUploadState("error");
  }
}



      async function blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result?.toString().split(",")[1];
            if (!base64) reject("base64 convert failed");
            resolve(base64!);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      async function handleAIDescription() {
      if (!findingText.trim()) {
        alert("Önce kısa bir açıklama yazın veya söyleyin");
        return;
      }

      const photos = mediaItems.filter(m => m.type === "photo");

      if (photos.length === 0) {
        alert("AI analiz için en az bir fotoğraf gereklidir");
        return;
      }

      try {
        setAiLoading(true);

        const images = await Promise.all(
          photos.map(async p => ({
            data: await blobToBase64(p.blob),
            type: p.blob.type || "image/jpeg",
          }))
        );

        const res = await fetch("/api/ai/finding-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: findingText,
            images, // 🔥 ARTIK BASE64
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data?.error ?? "AI hata verdi");

        setFindingText(data.text);
      } catch (err) {
        console.error(err);
        alert("AI açıklama oluşturamadı");
      } finally {
        setAiLoading(false);
      }
    }



  /* ================= UI ================= */
return (
  <div className="flex h-full flex-col">
    {completed ? (
      <CompletionScreen
        submissionId={submissionId}
        onGoHome={() => router.push("/operator/tasks")}
        onViewDetail={() =>
          router.push(`/operator/submissions/${submissionId}`)
        }
      />
    ) : (
      <>
        {/* PROGRESS */}
        <div className="px-5 pt-5">
          <div className="flex justify-between mb-2 text-xs text-neutral-400">
            <span>Denetim Adımı {step + 1}</span>
            <span>
              %{Math.round(((step + 1) / questions.length) * 100)}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-neutral-700 overflow-hidden">
            <div
              className="h-full bg-primary transition-[width] duration-500 ease-out"
              style={{
                width: `${((step + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* QUESTION */}
        <div className="flex-1 px-5 py-6">
          <div className="rounded-3xl bg-gradient-to-br from-bg800 to-bg900 p-7 shadow-xl">
            <p className="text-lg font-medium leading-relaxed text-white">
              {current.text}
            </p>
          </div>
        </div>

        {/* ACTION BAR */}
        <div
          className="
            sticky bottom-0 z-40
            bg-bg900/95 backdrop-blur
            border-t border-bg700
            px-5 pt-3 pb-safe
          "
        >
          {!completed && (
            <div className="flex justify-center mb-3">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                className="text-xs text-neutral-400"
              >
                ← Önceki soruya dön
              </button>
            </div>
          )}

          <div className="flex gap-3">
            {!allAnswered ? (
              <>
                <button
                  onClick={handleNo}
                  className="flex-1 h-14 rounded-2xl border border-danger/40
                            text-danger font-semibold bg-danger/5"
                >
                  Uygun Değil
                </button>

                <button
                  onClick={handleYes}
                  className="flex-1 h-14 rounded-2xl bg-success
                            text-white font-semibold"
                >
                  Uygun
                </button>
              </>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={uploadState !== "idle"}
                aria-busy={uploadState === "uploading"}
                className={`
                  flex-1 h-14 rounded-2xl
                  font-semibold text-white
                  transition
                  ${
                    uploadState !== "idle"
                      ? "bg-primary/60 cursor-not-allowed"
                      : "bg-primary hover:brightness-110 active:scale-[0.98]"
                  }
                `}
              >
                {uploadState === "uploading"
                  ? "Denetim Gönderiliyor…"
                  : uploadState === "success"
                  ? "Gönderildi ✓"
                  : "Denetimi Tamamla"}
              </button>
            )}
          </div>
        </div>

        {/* FINDING SHEET */}
        {showFinding && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
            <div
              ref={sheetRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: keyboardOffset
                  ? `translateY(-${keyboardOffset}px)`
                  : undefined,
                transition: "transform 0.25s ease-out",
              }}
              className="
                absolute bottom-0 w-full
                max-h-[85vh]
                rounded-t-2xl
                bg-white
                shadow-2xl
                flex flex-col
              "
            >
              <div className="mx-auto mt-2 mb-2 h-1 w-10 rounded-full bg-neutral-300" />

              <div className="px-4 pb-2 flex items-start justify-between border-b">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Uygunsuzluk Bildirimi
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Açıklama ve en az bir fotoğraf veya video zorunludur
                  </p>
                </div>

                <button
                  onClick={attemptCloseFinding}
                  className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-neutral-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-3">
                <div className="relative overflow-visible rounded-xl border border-neutral-300">
                  <textarea
                    className="
                      w-full min-h-[90px]
                      rounded-xl p-3 pr-28 text-sm
                      text-neutral-900 bg-white
                      placeholder:text-neutral-400
                      resize-none
                      focus:outline-none
                      focus:ring-2 focus:ring-primary/30
                    "
                    placeholder="Uygunsuzluğu kısaca açıklayın…"
                    value={findingText}
                    onChange={e => setFindingText(e.target.value)}
                  />
                <button
                  type="button"
                  disabled={aiLoading || !hasPhoto}
                  onClick={handleAIDescription}
                  className={`
                    mt-2 w-full h-11 rounded-xl
                    text-sm font-semibold
                    transition
                    ${
                      aiLoading || !hasPhoto
                        ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                        : "bg-indigo-600 text-white"
                    }
                  `}
                >
                  {aiLoading
                    ? "AI yazıyor…"
                    : hasPhoto
                    ? "🧠 AI ile açıklama oluştur"
                    : "📷 Fotoğraf ekleyin"}
                </button>


                  <div
                    className="
                      absolute bottom-2
                      right-[calc(0.5rem+env(safe-area-inset-right))]
                      flex items-center gap-1
                      rounded-full bg-white/95
                      border border-neutral-300
                      shadow-md
                      px-1 py-1
                      z-10
                      transition-all duration-200
                    "
                  >
                    <button
                      onClick={startDictation}
                      className="
                        h-9 w-9 rounded-full
                        flex items-center justify-center
                        text-neutral-700
                        hover:bg-neutral-100
                        active:scale-95
                        transition
                      "
                    >
                      <Mic className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setShowPhotoPicker(true)}
                      className="
                        h-9 w-9 shrink-0
                        rounded-full
                        flex items-center justify-center
                        bg-primary text-white
                      "
                    >
                      <Camera className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-neutral-500">
                    Medya ({mediaItems.length})
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {mediaItems.map((item, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg overflow-hidden border"
                      >
                        {item.type === "photo" ? (
                          <img
                            src={item.preview}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.preview}
                            className="h-full w-full object-cover"
                            playsInline
                            muted
                            controls
                          />
                        )}

                        <button
                          onClick={() => {
                            URL.revokeObjectURL(item.preview);
                            setMediaItems(prev =>
                              prev.filter((_, idx) => idx !== i)
                            );
                          }}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => setShowPhotoPicker(true)}
                      className="aspect-square rounded-lg border border-dashed flex items-center justify-center text-neutral-400"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border">
                    {error}
                  </div>
                )}
              </div>

              <div className="border-t px-4 py-3">
                <button
                  onClick={handleSaveFinding}
                  disabled={uploadState === "uploading"}
                  className="h-12 w-full rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60"
                >
                  {uploadState === "uploading"
                    ? "Yükleniyor…"
                    : "Kaydet ve Devam Et"}
                </button>
              </div>
            </div>
          </div>
        )}

        {cameraOpen && (
          <CameraView
            onCapture={handleCapture}
            onClose={() => setCameraOpen(false)}
          />
        )}

        {showPhotoPicker && (
          <div className="fixed inset-0 z-[60] bg-black/40 flex items-end">
            <div className="w-full bg-white rounded-t-2xl p-4 space-y-3">
              <div className="space-y-2 px-4 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoPicker(false);
                    setCameraOpen(true);
                  }}
                  className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Camera className="h-5 w-5" />
                  Kamera / Video ile Çek
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoPicker(false);
                    requestAnimationFrame(() => {
                      fileInputRef.current?.click();
                    });
                  }}
                  className="w-full h-12 rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-300 font-semibold flex items-center justify-center gap-2"
                >
                  🖼️ Galeriden Seç
                </button>

                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(false)}
                  className="w-full h-10 rounded-xl text-sm text-neutral-600"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={async e => {
            const files = Array.from(e.target.files ?? []);
            for (const file of files) {
              if (file.type.startsWith("image")) {
                const quality = await analyzeQuality(file);
                if (!quality.ok) {
                  setError(quality.reason);
                  continue;
                }
              }

              const preview = URL.createObjectURL(file);
              setMediaItems(prev => [
                ...prev,
                {
                  blob: file,
                  type: file.type.startsWith("video") ? "video" : "photo",
                  preview,
                },
              ]);
            }

            e.target.value = "";
          }}
        />
      </>
    )}
  </div>
);
}
