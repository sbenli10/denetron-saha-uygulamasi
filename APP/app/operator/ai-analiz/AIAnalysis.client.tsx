// APP/app/operator/ai-analiz/AIAnalysis.client.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Camera,
  ShieldAlert,
  Sparkles,
  WifiOff,
  CheckCircle2,
  X,
} from "lucide-react";

import MediaSelector from "./components/MediaSelector";
import AIResultCard from "./components/AIResultCard";
import LegalNotice from "./components/LegalNotice";

import VisionOverlay, { LiveRisk } from "@/components/operator/VisionOverlay";
import CameraView from "@/components/operator/CameraView";

import { AIMediaItem } from "./types";

import { Badge, Button, Card, CardContent, CardHeader, SectionTitle, Sheet } from "@/app/components/ui/ui";
import { cn } from "@/app/components/ui/cn";

type AIStatus =
  | "idle"
  | "capturing"
  | "analyzing"
  | "success"
  | "error";

export default function AIAnalysisClient({ taskId }: { taskId: string }) {
  const [accepted, setAccepted] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<AIMediaItem[]>([]);
  const [result] = useState<string | null>(null); // image-analysis v2 için hazır

  /* ================= LIVE ================= */
  const [liveOpen, setLiveOpen] = useState<boolean>(false);
  const [liveRisks, setLiveRisks] = useState<LiveRisk[]>([]);
  const [aiOffline, setAiOffline] = useState<boolean>(false);

  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus>("idle");
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const [showHelp, setShowHelp] = useState<boolean>(false);

  const lastVisionCall = useRef<number>(0);

  const canStartLive = accepted; // sadece kabul edilince
  const selectedCount = selectedMedia.length;

  const headerBadges = useMemo(() => {
    return {
      accepted: accepted,
      selected: selectedCount,
    };
  }, [accepted, selectedCount]);

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
    let data: unknown;

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

    if (!res.ok || !data || typeof data !== "object") {
      console.error("[vision-live] invalid response", res.status);
      setAiStatus("error");
      setAiMessage("AI analiz hatası");
      setAiLoading(false);
      activateManualFallback();
      return;
    }

    const payload = data as any;

    if (payload.offline) {
      setAiStatus("error");
      setAiMessage("AI geçici olarak devre dışı");
      setAiOffline(true);
      setAiLoading(false);
      return;
    }

    /* ================= RISK NORMALIZATION ================= */
    const risks: LiveRisk[] = (payload.risks ?? []).map((r: any) => ({
      id: uuid(),
      label: String(r.label ?? "Risk"),
      severity: (r.severity ?? "low") as LiveRisk["severity"],
      confidence:
        typeof r.confidence === "number"
          ? r.confidence
          : typeof r.confidence === "string"
          ? Number.parseFloat(r.confidence)
          : 0.6,
      awareness: r.why_risk ?? null,
      mitigation: r.what_to_do ?? null,
      consequence: r.if_ignored ?? null,
      box: r.box ?? defaultBox(),
    }));

    setLiveRisks(risks);

    setAiResult(
      payload.summary ??
        (risks.length > 0 ? `${risks.length} risk fark ettirildi.` : "Risk fark edilmedi.")
    );

    setAiStatus("success");
    setAiMessage("AI analiz tamamlandı");
    setAiLoading(false);

    /* ================= AUDIT LOG (SUMMARY ONLY) ================= */
    if (risks.length > 0) {
      try {
        const riskSummary = risks.map((r) => ({
          label: r.label,
          severity: r.severity,
          confidence:
            typeof r.confidence === "number" && !Number.isNaN(r.confidence)
              ? r.confidence
              : null,
        }));

        const maxConfidence = Math.max(...riskSummary.map((r) => r.confidence ?? 0));

        const auditRes = await fetch("/api/ai/audit/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "vision-live",
            ai_used: true,
            operator_action: "presented",
            reason: "ai-awareness-report",
            confidence: maxConfidence || null,
            operator_note: JSON.stringify({
              risk_count: risks.length,
              risks: riskSummary,
            }),
            task_id: taskId,
          }),
        });

        if (!auditRes.ok) {
          const errText = await auditRes.text();
          console.error("[audit] http error", auditRes.status, errText);
        }
      } catch (err) {
        console.error("[audit] write failed", err);
      }
    }
  }

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
        confidence: typeof risk.confidence === "number" ? risk.confidence : null,
        operator_action: "acknowledged",
        task_id: taskId,
      }),
    }).catch((err) => console.error("[audit] addRiskToAudit failed", err));
  }

  const topStatus = useMemo(() => {
    if (aiStatus === "idle") return null;

    if (aiStatus === "analyzing") {
      return { tone: "warning" as const, text: "Analiz ediliyor" };
    }
    if (aiStatus === "success") {
      return { tone: "success" as const, text: "Analiz tamamlandı" };
    }
    return { tone: "danger" as const, text: "Analiz hatası" };
  }, [aiStatus]);

  return (
    <main className="min-h-screen text-[color:var(--op-text)]">
      <div className="mx-auto max-w-md px-4 pt-5 pb-28 space-y-4">
        {/* HEADER */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[18px] font-extrabold tracking-tight truncate">Yapay Zeka Analiz</div>
              <div className="text-[12px] text-[color:var(--op-muted)]">
                Saha farkındalığı için canlı kamera ve kayıt analizi.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="h-12 w-12 rounded-[var(--op-radius-2xl)] border border-[color:var(--op-border)] bg-white/5 flex items-center justify-center"
              aria-label="Yardım"
            >
              <Sparkles className="h-5 w-5 text-[color:var(--op-primary-2)]" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {headerBadges.accepted ? (
              <Badge tone="success" className="border-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Onaylandı
              </Badge>
            ) : (
              <Badge tone="warning" className="border-0">
                <ShieldAlert className="h-3.5 w-3.5" />
                Onay gerekli
              </Badge>
            )}

            {headerBadges.selected > 0 ? (
              <Badge tone="neutral" className="border-0">
                {headerBadges.selected} medya seçildi
              </Badge>
            ) : (
              <Badge tone="neutral" className="border-0">
                Medya seçilmedi
              </Badge>
            )}

            {aiOffline ? (
              <Badge tone="warning" className="border-0">
                <WifiOff className="h-3.5 w-3.5" />
                AI Offline
              </Badge>
            ) : null}

            {topStatus ? (
              <Badge tone={topStatus.tone} className="border-0">
                ● {topStatus.text}
              </Badge>
            ) : null}
          </div>
        </div>

        {/* LEGAL */}
        <LegalNotice accepted={accepted} onChange={setAccepted} />

        {/* MEDIA */}
        <Card>
          <CardHeader>
            <SectionTitle
              title="Analize Dahil Edilecek Medyalar"
              subtitle="Seçim yaparsanız v2 görüntü analizine hazır olur."
              right={
                selectedCount > 0 ? (
                  <Badge tone="warning" className="border-0">
                    {selectedCount} seçildi
                  </Badge>
                ) : null
              }
            />
          </CardHeader>
          <CardContent className="pt-2">
            <MediaSelector onChange={setSelectedMedia} />
          </CardContent>
        </Card>

        {/* LIVE CTA */}
        <Card>
          <CardHeader>
            <SectionTitle
              title="Canlı Kamera"
              subtitle="Kameradan alınan kare AI ile analiz edilir."
              right={
                aiLoading ? (
                  <Badge tone="warning" className="border-0">
                    Çalışıyor…
                  </Badge>
                ) : null
              }
            />
          </CardHeader>
          <CardContent className="pt-2">
            <Button
              type="button"
              tone="primary"
              size="lg"
              leftIcon={Camera}
              className="w-full"
              disabled={!canStartLive}
              onClick={() => setLiveOpen(true)}
            >
              Canlı AI Kamera
            </Button>

            {!accepted ? (
              <div className="mt-2 text-[12px] text-[color:var(--op-muted)]">
                Canlı mod için önce <span className="font-semibold">hukuki bilgilendirmeyi</span> kabul etmelisiniz.
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* RESULT LIST */}
        {liveRisks.length > 0 ? (
          <Card>
            <CardHeader>
              <SectionTitle
                title="Tespitler"
                subtitle="Riskleri dokunarak detaylandırın ve audit’e ekleyin."
                right={
                  <Badge tone="neutral" className="border-0">
                    {liveRisks.length} risk
                  </Badge>
                }
              />
            </CardHeader>
            <CardContent className="pt-2">
              <AIResultCard risks={liveRisks} />
            </CardContent>
          </Card>
        ) : result ? (
          <Card>
            <CardHeader>
              <SectionTitle title="Analiz Sonucu" subtitle="Görüntü analizi (v2) çıktısı" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="whitespace-pre-line text-[13px] text-[color:var(--op-text)]">{result}</div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* LIVE CAMERA */}
      {liveOpen ? (
        <CameraView
          onClose={() => {
            setLiveOpen(false);
            setLiveRisks([]);
            setAiResult(null);
            setAiStatus("idle");
            setAiMessage(null);
            setAiOffline(false);
            setAiLoading(false);
          }}
          onCapture={() => {}}
          onAnalyzeFrame={analyzeLiveFrame}
          overlay={
            <div className="absolute inset-0">
              {/* TOP LEFT OFFLINE */}
              {aiOffline ? (
                <div
                  className={cn(
                    "absolute top-4 left-4 z-40",
                    "rounded-[16px] px-3 py-2 backdrop-blur border",
                    "bg-[color:color-mix(in_oklab,var(--op-warning)_16%,black)]",
                    "border-[color:color-mix(in_oklab,var(--op-warning)_35%,transparent)]",
                    "text-[12px] font-semibold text-[color:var(--op-text)]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4" />
                    AI geçici olarak devre dışı
                  </div>
                </div>
              ) : null}

              {/* TOP RIGHT STATUS */}
              {aiStatus !== "idle" ? (
                <div
                  className={cn(
                    "absolute top-4 right-4 z-40",
                    "rounded-full px-3 py-2 backdrop-blur border",
                    "bg-black/70 border-[color:var(--op-border)]",
                    "text-[11px] font-extrabold"
                  )}
                >
                  {aiStatus === "analyzing" ? (
                    <span className="text-[color:var(--op-warning)]">● Analiz ediliyor</span>
                  ) : null}
                  {aiStatus === "success" ? (
                    <span className="text-[color:var(--op-success)]">● Analiz tamamlandı</span>
                  ) : null}
                  {aiStatus === "error" ? (
                    <span className="text-[color:var(--op-danger)]">● Analiz hatası</span>
                  ) : null}
                </div>
              ) : null}

              {/* RISK MAP (TAŞIMA) */}
              <VisionOverlay risks={liveRisks} onSelect={addRiskToAudit} aiOffline={aiOffline} />

              {/* BOTTOM REPORT */}
              {aiResult ? (
                <div
                  className={cn(
                    "absolute bottom-24 left-1/2 -translate-x-1/2 z-40",
                    "w-[92%] max-w-md",
                    "rounded-[var(--op-radius-3xl)] border",
                    "bg-black/75 backdrop-blur",
                    "border-[color:var(--op-border)] shadow-[var(--op-shadow-2)]",
                    "px-5 py-4"
                  )}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-extrabold text-[color:var(--op-primary-2)]">
                        AI Inspection Report
                      </div>
                      {aiMessage ? (
                        <div className="text-[11px] text-[color:var(--op-muted)]">{aiMessage}</div>
                      ) : null}
                    </div>

                    <Badge tone="neutral" className="border-0">
                      {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </Badge>
                  </div>

                  <p className="text-[13px] leading-relaxed whitespace-pre-line text-[color:var(--op-text)]">
                    {aiResult}
                  </p>

                  {liveRisks.length > 0 ? (
                    <div className="mt-3 pt-3 border-t border-[color:var(--op-border)] space-y-1">
                      {liveRisks.map((r) => (
                        <div key={r.id} className="flex justify-between text-[11px] text-[color:var(--op-muted)]">
                          <span className="truncate">• {r.label}</span>
                          <span className="font-extrabold text-[color:var(--op-text)]">%{getConfidencePercent(r)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          }
        />
      ) : null}

      {/* HELP SHEET */}
      <Sheet open={showHelp} onClose={() => setShowHelp(false)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15px] font-extrabold">AI Kullanım Notları</div>
            <div className="text-[12px] text-[color:var(--op-muted)]">
              Bu ekran saha farkındalığı içindir. Nihai karar operatöre aittir.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="h-11 w-11 rounded-2xl border border-[color:var(--op-border)] bg-white/5 flex items-center justify-center"
            aria-label="Kapat"
          >
            <X className="h-5 w-5 text-[color:var(--op-muted)]" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-[12px] text-[color:var(--op-muted)]">
          <div className="rounded-[16px] border border-[color:var(--op-border)] bg-white/5 p-4">
            <div className="font-semibold text-[color:var(--op-text)]">Canlı AI Kamera</div>
            <div className="mt-1">
              AI, belirli aralıklarla kare alır ve olası riskleri overlay üzerinde işaretler.
            </div>
          </div>

          <div className="rounded-[16px] border border-[color:var(--op-border)] bg-white/5 p-4">
            <div className="font-semibold text-[color:var(--op-text)]">Audit kayıtları</div>
            <div className="mt-1">
              AI çıktısı yalnızca özetlenmiş şekilde loglanır. Operatör “acknowledged” aksiyonu ile kayıt oluşturur.
            </div>
          </div>
        </div>
      </Sheet>
    </main>
  );
}
