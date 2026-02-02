//APP\app\operator\ai-analiz\AIAnalysis.client.tsx
"use client";

import { useRef, useState } from "react";
import MediaSelector from "./components/MediaSelector";
import AIResultCard from "./components/AIResultCard";
import LegalNotice from "./components/LegalNotice";
import VisionOverlay, { LiveRisk } from "@/components/operator/VisionOverlay";
import CameraView from "@/components/operator/CameraView";
import { AIMediaItem } from "./types";
import { v4 as uuid } from "uuid";
import { Camera } from "lucide-react";

type AIStatus =
  | "idle"        // hiçbir şey yok
  | "capturing"   // frame alınıyor
  | "analyzing"   // backend / gemini çalışıyor
  | "success"     // sonuç geldi
  | "error";      // hata / offline

export default function AIAnalysisClient({
  taskId,
}: {
  taskId: string;
}) {


  const [accepted, setAccepted] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<AIMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  /* ================= LIVE ================= */
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveRisks, setLiveRisks] = useState<LiveRisk[]>([]);
  const [aiOffline, setAiOffline] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus>("idle");
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const lastVisionCall = useRef(0);

  /* ================= IMAGE ANALYSIS ================= */
  // TODO: image-analysis will be re-enabled in v2

// async function runAnalysis() {
//   if (!accepted || selectedMedia.length === 0) return;
//   try {
//     setLoading(true);

//     const res = await fetch("/api/ai/finding-analysis", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         images: selectedMedia.map(m => m.url),
//       }),
//     });

//     const data = await res.json();
//     if (!res.ok) throw new Error("analysis_failed");

//     setResult(data.text);

//     /* ✅ AUDIT LOG – DOĞRU FORMAT */
//     await fetch("/api/ai/audit/ai", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         source: "image-analysis",
//         ai_used: true,
//         reason: "image-analysis",
//         confidence: null,
//         operator_action: "presented",
//         task_id: taskId,
//       }),
//     });


//   } catch (err) {
//     console.error("[image-analysis] error", err);
//   } finally {
//     setLoading(false);
//   }
// }

/* ================= LIVE FRAME ================= */
async function analyzeLiveFrame(imageBase64: string) {
  const now = Date.now();
  if (now - lastVisionCall.current < 15000) return;
  lastVisionCall.current = now;

  setAiLoading(true);
  setAiStatus("analyzing");
  setAiMessage("AI analiz ediliyor…");
  setAiOffline(false);
  setAiResult(null);

  let res: Response;
  let data: any;

  try {
    res = await fetch("/api/ai/vision-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });
    data = await res.json();
  } catch (err) {
    console.error("[vision-live] network error", err);
    setAiStatus("error");
    setAiMessage("AI servisine ulaşılamadı");
    setAiLoading(false);
    activateManualFallback();
    return;
  }

  if (!res.ok || !data) {
    console.error("[vision-live] invalid response", res.status);
    setAiStatus("error");
    setAiMessage("AI analiz hatası");
    setAiLoading(false);
    activateManualFallback();
    return;
  }

  if (data.offline) {
    setAiStatus("error");
    setAiMessage("AI geçici olarak devre dışı");
    setAiOffline(true);
    setAiLoading(false);
    return;
  }

  /* ================= RISK NORMALIZATION ================= */

    const risks: LiveRisk[] = (data.risks ?? []).map((r: any) => ({
    id: uuid(),
    label: r.label,
    severity: r.severity ?? "low",
    confidence:
      typeof r.confidence === "number"
        ? r.confidence
        : typeof r.confidence === "string"
        ? Number.parseFloat(r.confidence)
        : 0.6,

    // 🔑 BURASI EKSİKTİ
    awareness: r.why_risk ?? null,
    mitigation: r.what_to_do ?? null,
    consequence: r.if_ignored ?? null,

    box: r.box ?? defaultBox(),
  }));


  setLiveRisks(risks);

  /* ================= UI RESULT ================= */

  setAiResult(
    data.summary ??
      (risks.length > 0
        ? `${risks.length} risk fark ettirildi.`
        : "Risk fark edilmedi.")
  );

  setAiStatus("success");
  setAiMessage("AI analiz tamamlandı");
  setAiLoading(false);

  /* ================= AUDIT LOG (ASIL KRİTİK KISIM) ================= */

  if (risks.length > 0) {
    const maxConfidence = Math.max(
      ...risks.map(r =>
        typeof r.confidence === "number" && !Number.isNaN(r.confidence)
          ? r.confidence
          : 0
      )
    );

    const riskSummary = risks.map(r => ({
      label: r.label,
      severity: r.severity,
      confidence: r.confidence,
    }));
    try {
      const riskSummary = risks.map(r => ({
        label: r.label,
        severity: r.severity,
        confidence:
          typeof r.confidence === "number" && !Number.isNaN(r.confidence)
            ? r.confidence
            : null,
      }));

      const maxConfidence = Math.max(
        ...riskSummary
          .map(r => r.confidence ?? 0)
      );

      const auditRes = await fetch("/api/ai/audit/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          /* === DB core === */
          source: "vision-live",          // ai_audit_logs.context
          ai_used: true,
          operator_action: "presented",

          /* === Decision semantics === */
          reason: "ai-awareness-report",  // ai_audit_logs.decision
          confidence: maxConfidence || null,

          /* === IMPORTANT: summary only === */
          operator_note: JSON.stringify({
            risk_count: risks.length,
            risks: riskSummary,
          }),

          /* === Optional trace === */
          task_id: taskId,
        }),
      });

      if (!auditRes.ok) {
        const errText = await auditRes.text();
        console.error("[audit] http error", auditRes.status, errText);
      } else {
        console.info("[audit] logged with risk summary");
      }
    } catch (err) {
      console.error("[audit] write failed", err);
    }
  }
}

    /* ================= HELPERS ================= */

    function defaultBox() {
    return {
        x: window.innerWidth * 0.3,
        y: window.innerHeight * 0.25,
        w: window.innerWidth * 0.4,
        h: window.innerHeight * 0.4,
    };
    }

    function getConfidencePercent(r: LiveRisk): number {
      const confidence =
        typeof r.confidence === "number"
          ? r.confidence
          : r.severity === "high"
          ? 0.85
          : r.severity === "medium"
          ? 0.6
          : 0.35;

      return Math.round(confidence * 100);
    }


    function activateManualFallback() {
    setAiOffline(true);
    setLiveRisks([
        {
        id: uuid(),
        label: "AI analiz yapılamadı (manuel farkındalık)",
        severity: "low",
        confidence: 0.5,
        box: defaultBox(),
        },
    ]);
  }


  /* ================= ADD TO AUDIT ================= */
  function addRiskToAudit(risk: LiveRisk) {
    fetch("/api/ai/audit/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "vision-live",
        ai_used: true,
        reason: risk.label,
        confidence:
          typeof risk.confidence === "number" ? risk.confidence : null,
        operator_action: "acknowledged",
        task_id: taskId,
      }),
    }).catch(err => {
      console.error("[audit] addRiskToAudit failed", err);
    });
  }




  return (
    <main className="min-h-screen bg-gradient-to-b from-[#05080f] to-[#020409] text-white">
      <div className="px-4 py-6 space-y-6 max-w-md mx-auto">

        <LegalNotice accepted={accepted} onChange={setAccepted} />
        <MediaSelector onChange={setSelectedMedia} />
       <button
        type="button"
        onClick={() => setLiveOpen(true)}
        aria-label="Canlı AI Kamera modunu başlat"
        className="
          w-full h-12
          flex items-center justify-center gap-2
          rounded-xl
          bg-amber-500 hover:bg-amber-400 active:bg-amber-600
          text-black text-sm font-semibold
          shadow-md shadow-amber-500/20
          transition-all duration-150
          focus:outline-none
          focus:ring-2 focus:ring-amber-400/60
          focus:ring-offset-2 focus:ring-offset-black
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <Camera className="w-4 h-4" />
        <span>Canlı AI Kamera</span>
      </button>


        {liveRisks.length > 0 && (
          <AIResultCard risks={liveRisks} />
        )}

      </div>

      {liveOpen && (
        <CameraView
            onClose={() => {
              setLiveOpen(false);
              setLiveRisks([]);
              setAiResult(null);
            }}
            onCapture={() => {}}
            onAnalyzeFrame={analyzeLiveFrame}
           overlay={
            <div className="absolute inset-0">

              {/* ⚠️ AI OFFLINE */}
              {aiOffline && (
                <div
                  className="
                    absolute top-4 left-1/2 -translate-x-1/2
                    z-40
                    rounded-lg
                    bg-yellow-500/20
                    text-yellow-300
                    text-xs
                    px-3 py-2
                    backdrop-blur
                    border border-yellow-500/30
                  "
                >
                  ⚠️ AI geçici olarak devre dışı
                </div>
              )}

              {/* 🧠 RISK MAP (BUNU ASLA TAŞIMA) */}
              <VisionOverlay
                risks={liveRisks}
                onSelect={addRiskToAudit}
                aiOffline={aiOffline}
              />

              {/* 🔄 AI DURUM BANNER */}
              {aiStatus !== "idle" && (
                <div
                  className="
                    absolute top-4 right-4
                    z-40
                    px-3 py-1.5
                    rounded-full
                    text-[11px]
                    backdrop-blur
                    bg-black/70
                    border border-white/10
                  "
                >
                  {aiStatus === "analyzing" && (
                    <span className="text-amber-300">● Analiz ediliyor</span>
                  )}
                  {aiStatus === "success" && (
                    <span className="text-emerald-400">● Analiz tamamlandı</span>
                  )}
                  {aiStatus === "error" && (
                    <span className="text-red-400">● Analiz hatası</span>
                  )}
                </div>
              )}

              {/* 📋 AI INSPECTION REPORT (SADECE SONUÇ VARSA) */}
              {aiResult && (
                <div
                  className="
                    absolute bottom-24 left-1/2 -translate-x-1/2
                    z-40
                    w-[92%] max-w-md
                    bg-black/85
                    text-white
                    rounded-2xl
                    px-5 py-4
                    backdrop-blur
                    border border-white/10
                    shadow-2xl
                  "
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-amber-400">
                      AI Inspection Report
                    </h3>
                    <span className="text-[10px] text-white/50">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {aiResult}
                  </p>

                  {liveRisks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                      {liveRisks.map(r => (
                        <div
                          key={r.id}
                          className="flex justify-between text-xs text-white/80"
                        >
                          <span>• {r.label}</span>
                          <span>%{getConfidencePercent(r)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          }
          />
        )}
    </main>
  );
}
