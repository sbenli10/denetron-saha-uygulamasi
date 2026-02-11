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
  <div className="flex min-h-[100svh] flex-col bg-[color:var(--op-bg)] text-[color:var(--op-text)]">
    {completed ? (
      <CompletionScreen
        submissionId={submissionId}
        onGoHome={() => router.push("/operator/tasks")}
        onViewDetail={() => router.push(`/operator/submissions/${submissionId}`)}
      />
    ) : (
      <>
        {/* ================= TOP BAR / PROGRESS ================= */}
        <div className="sticky top-0 z-30 border-b border-[color:var(--op-border)] bg-[color:color-mix(in_oklab,var(--op-bg)_85%,transparent)] backdrop-blur">
          <div className="mx-auto max-w-md px-4 pt-4 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-widest text-[color:var(--op-muted)]">
                  Denetim Akışı
                </div>
                <div className="text-[14px] font-extrabold truncate">
                  Adım {step + 1} / {questions.length}
                </div>
              </div>

              <div className="shrink-0 rounded-full border border-[color:var(--op-border)] bg-white/5 px-3 py-1 text-[11px] font-extrabold">
                %{Math.round(((step + 1) / questions.length) * 100)}
              </div>
            </div>

            <div className="mt-3 h-2.5 rounded-full bg-black/25 overflow-hidden border border-[color:var(--op-border)]">
              <div
                className="h-full rounded-full bg-[color:var(--op-primary)] transition-[width] duration-500 ease-out"
                style={{ width: `${((step + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* OPTIONAL: micro hint */}
            <div className="mt-2 text-[11px] text-[color:var(--op-muted)]">
              Hızlı seçim: <span className="font-semibold text-[color:var(--op-text)]">Uygun</span> /{" "}
              <span className="font-semibold text-[color:var(--op-text)]">Uygun Değil</span>
            </div>
          </div>
        </div>

        {/* ================= QUESTION SURFACE ================= */}
        <div className="mx-auto w-full max-w-md flex-1 px-4 pt-5 pb-28">
          {/* Question card */}
          <div className="rounded-[var(--op-radius-3xl)] border border-[color:var(--op-border)] bg-[color:var(--op-surface-1)] shadow-[var(--op-shadow-2)] overflow-hidden">
            {/* Header strip */}
            <div className="px-5 pt-5 pb-4 bg-gradient-to-b from-white/5 to-transparent">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-[color:var(--op-primary-2)]">
                    Soru
                  </div>
                  <div className="mt-1 text-[16px] font-extrabold leading-snug">
                    {current.text}
                  </div>
                </div>

                {/* Severity badge / optional hook: you can swap with current.severity */}
                <div className="shrink-0 rounded-full border border-[color:var(--op-border)] bg-black/20 px-3 py-1 text-[11px] font-extrabold">
                  #{step + 1}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pb-5">
              <div className="rounded-[20px] border border-[color:var(--op-border)] bg-black/15 p-4">
                <div className="text-[12px] text-[color:var(--op-muted)] leading-relaxed">
                  Gözlem yapın, ekipman/alanı kontrol edin. Uygunsuzluk varsa açıklama ve medya ekleyin.
                </div>
              </div>

              {/* Previous */}
              {!completed && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    className="text-[12px] font-semibold text-[color:var(--op-muted)] hover:text-[color:var(--op-text)]"
                  >
                    ← Önceki soruya dön
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= ACTION BAR ================= */}
        <div
          className="
            sticky bottom-0 z-40
            border-t border-[color:var(--op-border)]
            bg-[color:color-mix(in_oklab,var(--op-bg)_88%,transparent)]
            backdrop-blur
          "
        >
          <div className="mx-auto max-w-md px-4 pt-3 pb-safe">
            {/* Inline status row */}
            <div className="mb-3 flex items-center justify-between text-[11px] text-[color:var(--op-muted)]">
              <span>Adım {step + 1} tamamlanıyor</span>
              <span className="font-semibold text-[color:var(--op-text)]">
                {allAnswered ? "Gönderime hazır" : "Yanıt bekleniyor"}
              </span>
            </div>

            <div className="flex gap-3">
              {!allAnswered ? (
                <>
                  <button
                    type="button"
                    onClick={handleNo}
                    className="
                      flex-1 h-[var(--op-touch)]
                      rounded-[var(--op-radius-2xl)]
                      border border-[color:color-mix(in_oklab,var(--op-danger)_45%,transparent)]
                      bg-[color:color-mix(in_oklab,var(--op-danger)_10%,transparent)]
                      text-[color:var(--op-danger)]
                      font-extrabold
                      active:scale-[0.99] transition
                    "
                  >
                    Uygun Değil
                  </button>

                  <button
                    type="button"
                    onClick={handleYes}
                    className="
                      flex-1 h-[var(--op-touch)]
                      rounded-[var(--op-radius-2xl)]
                      bg-[color:var(--op-success)]
                      text-white
                      font-extrabold
                      shadow-[var(--op-shadow-1)]
                      active:scale-[0.99] transition
                    "
                  >
                    Uygun
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={uploadState !== "idle"}
                  aria-busy={uploadState === "uploading"}
                  className={[
                    "flex-1 h-[var(--op-touch)] rounded-[var(--op-radius-2xl)] font-extrabold text-white transition",
                    uploadState !== "idle"
                      ? "bg-[color:color-mix(in_oklab,var(--op-primary)_55%,transparent)] cursor-not-allowed"
                      : "bg-[color:var(--op-primary)] hover:brightness-110 active:scale-[0.99]",
                  ].join(" ")}
                >
                  {uploadState === "uploading"
                    ? "Denetim Gönderiliyor…"
                    : uploadState === "success"
                    ? "Gönderildi ✓"
                    : "Denetimi Tamamla"}
                </button>
              )}
            </div>

            {/* Safe-area spacer */}
            <div className="h-2" />
          </div>
        </div>

        {/* ================= FINDING SHEET ================= */}
        {showFinding && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
            <div
              ref={sheetRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: keyboardOffset ? `translateY(-${keyboardOffset}px)` : undefined,
                transition: "transform 0.25s ease-out",
              }}
              className="
                absolute bottom-0 w-full
                max-h-[88vh]
                rounded-t-[28px]
                bg-[color:var(--op-surface-1)]
                border border-[color:var(--op-border)]
                shadow-[var(--op-shadow-2)]
                flex flex-col
              "
            >
              {/* grabber */}
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/15" />

              {/* header */}
              <div className="px-4 pt-3 pb-3 flex items-start justify-between gap-3 border-b border-[color:var(--op-border)]">
                <div className="min-w-0">
                  <div className="text-[14px] font-extrabold text-[color:var(--op-text)]">
                    Uygunsuzluk Bildirimi
                  </div>
                  <div className="mt-0.5 text-[11px] text-[color:var(--op-muted)]">
                    Açıklama + en az 1 fotoğraf/video zorunludur
                  </div>
                </div>

                <button
                  type="button"
                  onClick={attemptCloseFinding}
                  className="h-11 w-11 rounded-2xl border border-[color:var(--op-border)] bg-white/5 flex items-center justify-center"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5 text-[color:var(--op-muted)]" />
                </button>
              </div>

              {/* content */}
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-3 space-y-3">
                {/* textarea */}
                <div className="rounded-[20px] border border-[color:var(--op-border)] bg-black/15 p-3">
                  <textarea
                    className="
                      w-full min-h-[110px]
                      rounded-[16px] p-3
                      text-[13px]
                      text-[color:var(--op-text)]
                      bg-black/10
                      placeholder:text-[color:var(--op-muted)]
                      resize-none
                      focus:outline-none
                      focus:ring-2 focus:ring-[color:var(--op-ring)]
                    "
                    placeholder="Uygunsuzluğu net ve kısa açıklayın… (ör: koruyucu kapak eksik, kablo açıkta vb.)"
                    value={findingText}
                    onChange={(e) => setFindingText(e.target.value)}
                  />

                  {/* tools row */}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={startDictation}
                      className="
                        flex-1 h-11 rounded-[16px]
                        border border-[color:var(--op-border)]
                        bg-white/5
                        text-[12px] font-extrabold
                        active:scale-[0.99] transition
                      "
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <Mic className="h-4 w-4" />
                        Sesli Not
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPhotoPicker(true)}
                      className="
                        flex-1 h-11 rounded-[16px]
                        bg-[color:var(--op-primary)]
                        text-white text-[12px] font-extrabold
                        shadow-[var(--op-shadow-1)]
                        active:scale-[0.99] transition
                      "
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <Camera className="h-4 w-4" />
                        Medya Ekle
                      </span>
                    </button>
                  </div>

                  {/* AI button */}
                  <button
                    type="button"
                    disabled={aiLoading || !hasPhoto}
                    onClick={handleAIDescription}
                    className={[
                      "mt-2 w-full h-11 rounded-[16px] text-[12px] font-extrabold transition",
                      aiLoading || !hasPhoto
                        ? "bg-white/10 text-[color:var(--op-muted)] cursor-not-allowed border border-[color:var(--op-border)]"
                        : "bg-[color:var(--op-primary-2)] text-black shadow-[var(--op-shadow-1)] active:scale-[0.99]",
                    ].join(" ")}
                  >
                    {aiLoading ? "AI yazıyor…" : hasPhoto ? "🧠 AI ile açıklama oluştur" : "📷 Önce fotoğraf ekleyin"}
                  </button>
                </div>

                {/* media grid */}
                <div className="rounded-[20px] border border-[color:var(--op-border)] bg-[color:var(--op-surface-1)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] text-[color:var(--op-muted)]">Medya ({mediaItems.length})</div>
                    <button
                      type="button"
                      onClick={() => setShowPhotoPicker(true)}
                      className="text-[11px] font-extrabold text-[color:var(--op-primary-2)]"
                    >
                      + Ekle
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {mediaItems.map((item, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-[14px] overflow-hidden border border-[color:var(--op-border)] bg-black/20"
                      >
                        {item.type === "photo" ? (
                          <img src={item.preview} className="h-full w-full object-cover" alt="" />
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
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(item.preview);
                            setMediaItems((prev) => prev.filter((_, idx) => idx !== i));
                          }}
                          className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center"
                          aria-label="Medyayı sil"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setShowPhotoPicker(true)}
                      className="
                        aspect-square rounded-[14px]
                        border border-dashed border-[color:var(--op-border)]
                        bg-white/5
                        flex items-center justify-center
                        text-[color:var(--op-muted)]
                        active:scale-[0.99] transition
                      "
                      aria-label="Medya ekle"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>

                  {error ? (
                    <div className="mt-3 rounded-[16px] border border-[color:color-mix(in_oklab,var(--op-danger)_35%,transparent)] bg-[color:color-mix(in_oklab,var(--op-danger)_10%,transparent)] px-3 py-2 text-[12px] text-[color:var(--op-danger)]">
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* footer */}
              <div className="border-t border-[color:var(--op-border)] px-4 py-3 bg-[color:color-mix(in_oklab,var(--op-bg)_60%,transparent)]">
                <button
                  type="button"
                  onClick={handleSaveFinding}
                  disabled={uploadState === "uploading"}
                  className={[
                    "h-[var(--op-touch)] w-full rounded-[var(--op-radius-2xl)] font-extrabold text-white transition",
                    uploadState === "uploading"
                      ? "bg-[color:color-mix(in_oklab,var(--op-primary)_55%,transparent)] cursor-not-allowed"
                      : "bg-[color:var(--op-primary)] hover:brightness-110 active:scale-[0.99]",
                  ].join(" ")}
                >
                  {uploadState === "uploading" ? "Yükleniyor…" : "Kaydet ve Devam Et"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CAMERA */}
        {cameraOpen && (
          <CameraView onCapture={handleCapture} onClose={() => setCameraOpen(false)} />
        )}

        {/* PHOTO PICKER */}
        {showPhotoPicker && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-end">
            <div className="w-full rounded-t-[28px] border border-[color:var(--op-border)] bg-[color:var(--op-surface-1)] p-4">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/15" />

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoPicker(false);
                    setCameraOpen(true);
                  }}
                  className="
                    w-full h-[var(--op-touch)]
                    rounded-[var(--op-radius-2xl)]
                    bg-[color:var(--op-primary)]
                    text-white font-extrabold
                    shadow-[var(--op-shadow-1)]
                    active:scale-[0.99] transition
                    flex items-center justify-center gap-2
                  "
                >
                  <Camera className="h-5 w-5" />
                  Kamera / Video ile Çek
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoPicker(false);
                    requestAnimationFrame(() => fileInputRef.current?.click());
                  }}
                  className="
                    w-full h-[var(--op-touch)]
                    rounded-[var(--op-radius-2xl)]
                    border border-[color:var(--op-border)]
                    bg-white/5
                    text-[color:var(--op-text)] font-extrabold
                    active:scale-[0.99] transition
                    flex items-center justify-center gap-2
                  "
                >
                  🖼️ Galeriden Seç
                </button>

                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(false)}
                  className="w-full h-11 rounded-[var(--op-radius-2xl)] text-[12px] text-[color:var(--op-muted)] font-semibold"
                >
                  İptal
                </button>
              </div>

              <div className="h-2" />
            </div>
          </div>
        )}

        {/* FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={async (e) => {
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
              setMediaItems((prev) => [
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
