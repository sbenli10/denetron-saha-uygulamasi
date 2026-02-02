// APP/app/admin/isg/annual-plan/page.tsx

"use client";
export const dynamic = "force-dynamic";

import { useMemo, useState, DragEvent } from "react";
import { UploadCloud, X, FileText, ArrowLeft, RefreshCw } from "lucide-react";

import AssistantPanel from "./components/AssistantPanel";
import ReportHeader from "./components/ReportHeader";
import ReportSummary from "./components/ReportSummary";
import DocumentAnalysis from "./components/DocumentAnalysis";
import ActionList from "./components/ActionList";

import { AnnualPlanAnalysis } from "./components/types";

type PreviewFile = {
  file: File;
  url?: string;
};



export default function AnnualPlanPage() {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [analysis, setAnalysis] = useState<AnnualPlanAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalSizeMb = useMemo(() => {
    const bytes = files.reduce((a, b) => a + (b.file?.size ?? 0), 0);
    return bytes / 1024 / 1024;
  }, [files]);

  const [analysisDelayNotice, setAnalysisDelayNotice] = useState(false);
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);


  /* ---------------- FILE HANDLING ---------------- */

  function addFiles(list: FileList | File[]) {
    setErrorMsg(null);

    const incoming = Array.from(list);
    if (!incoming.length) return;

    const mapped: PreviewFile[] = incoming.map((f) => ({
      file: f,
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));

    setFiles((prev) => [...prev, ...mapped]);
  }
  function applyAction(actionId: string) {
    if (!analysis || !analysis.actions) return;

    setAnalysis({
      ...analysis,
      actions: analysis.actions.map((a) =>
        a.id === actionId
          ? {
              ...a,
              status: "applied",
              appliedAt: new Date().toISOString(),
            }
          : a
      ),
    });
  }

  function createActionPlan() {
  if (!analysis) return;

  fetch("/api/admin/isg/annual-plan/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis, // backend tarafında requiredActions + criticalFindings kullanılacak
    }),
  })
    .then(() => {
      // Aksiyon Planı sayfasına yönlendir
      window.location.href = "/admin/isg/annual-plan/actions";
    })
    .catch(() => {
      alert("Aksiyon planı oluşturulurken hata oluştu.");
    });
}


    function hasAnnualPlan(files: { file: File }[]) {
    return files.some(({ file }) => {
      const name = file.name.toLowerCase();
      return (
        name.includes("çalışma") ||
        name.includes("calisma") ||
        name.includes("eğitim") ||
        name.includes("egitim") ||
        name.includes("plan")
      );
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      const copy = [...prev];
      if (copy[index]?.url) URL.revokeObjectURL(copy[index].url!);
      copy.splice(index, 1);
      return copy;
    });
  }

  function resetAll() {
    files.forEach((f) => f.url && URL.revokeObjectURL(f.url));
    setFiles([]);
    setAnalysis(null);
    setErrorMsg(null);
    setDragActive(false);
    setLoading(false);
  }

 async function analyze() {
  if (!files.length || loading) return;

  setLoading(true);
  setErrorMsg(null);
  setAnalysisDelayNotice(false);
  setAnalysisStartTime(Date.now());

  const fd = new FormData();
  files.forEach(({ file }) => fd.append("files", file));

  // ⏱️ 15 saniye sonra kullanıcıyı bilgilendir
  const delayTimer = setTimeout(() => {
    setAnalysisDelayNotice(true);
  }, 15000);

  try {
    const res = await fetch("/api/admin/isg/analyze/annual-plan", {
      method: "POST",
      body: fd,
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.result) {
      const actions = data.result.summary.requiredActions.map(
        (text: string, i: number) => ({
          id: `action-${i}`,
          text,
          status: "pending" as const,
        })
      );

      setAnalysis({
        ...data.result,
        actions,
      });
    } else {
      setErrorMsg("Analiz sonucu alınamadı. Lütfen tekrar deneyin.");
    }
  } catch (err) {
    console.error("ANALYZE ERROR", err);
    setErrorMsg("Ağ hatası oluştu. Lütfen bağlantınızı kontrol edin.");
  } finally {
    clearTimeout(delayTimer); // ⛔ timer temizlenir
    setLoading(false);
    setAnalysisDelayNotice(false);
    setAnalysisStartTime(null);
  }
}



  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 space-y-10">
      {/* HEADER */}
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">İSG Denetçi Asistanı</h1>
            <p className="text-gray-600 max-w-3xl mt-2">
              Yıllık İSG çalışma planı, eğitim belgeleri veya fotoğrafları yükleyin. Sistem belgeleri
              denetçi bakış açısıyla analiz ederek sizi denetime hazırlar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {analysis ? (
              <button
                onClick={() => setAnalysis(null)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                title="Belge yüklemeye dön"
              >
                <ArrowLeft size={16} />
                Geri
              </button>
            ) : (
              <button
                onClick={resetAll}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                title="Sıfırla"
              >
                <RefreshCw size={16} />
                Sıfırla
              </button>
            )}
          </div>
        </div>
      </header>

      {/* UPLOAD */}
        {!analysis && (
          <section className="rounded-3xl border bg-white p-8 shadow-sm space-y-8">
            {/* DROP ZONE */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e: DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                setDragActive(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`
                rounded-2xl border-2 border-dashed px-8 py-14 text-center transition
                ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-300 bg-gray-50"
                }
              `}
            >
              <label className="cursor-pointer flex flex-col items-center gap-4">
                <UploadCloud size={48} className="text-gray-400" />

                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-900">
                    Belge veya Fotoğraf Yükleyin
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, Word, Excel veya mobil fotoğraf
                  </p>
                  <p className="text-xs text-gray-400">
                    Sürükle &amp; bırak veya dosya seç
                  </p>
                </div>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.xls,.xlsx,.doc,.docx,image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </label>
            </div>

            {/* STATUS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-gray-50 px-5 py-3 text-sm text-gray-600">
              <div>
                <span className="font-medium text-gray-900">
                  {files.length}
                </span>{" "}
                dosya seçildi
                {files.length > 0 && (
                  <span className="ml-2 text-gray-500">
                    • Toplam {totalSizeMb.toFixed(2)} MB
                  </span>
                )}
              </div>

              <div className="text-gray-500">
                Öneri: Net fotoğraf ve okunabilir belge analizi hızlandırır
              </div>
            </div>

            {/* ANNUAL PLAN WARNING */}
              {files.length > 0 && !hasAnnualPlan(files) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 space-y-1">
                  <p className="font-semibold flex items-center gap-2">
                    ⚠️ Denetçi Uyarısı
                  </p>
                  <p>
                    Yüklenen dosyalar arasında <b>İSG Yıllık Çalışma Planı</b> veya{" "}
                    <b>Yıllık Eğitim Planı</b> belgesi tespit edilemedi.
                  </p>
                  <p className="text-xs text-amber-700">
                    Bu belgeler olmadan yapılacak analiz, resmi denetim öncesi hazırlık
                    açısından <b>eksik</b> kabul edilebilir.
                  </p>
                </div>
              )}


            {/* ERROR */}
            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            {/* FILE PREVIEW */}
            {files.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {files.map((item, i) => (
                  <div
                    key={i}
                    className="group relative rounded-2xl border bg-white p-3 shadow-sm"
                  >
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-2 right-2 z-10 rounded-md bg-white p-1 shadow hover:bg-gray-100"
                      aria-label="Dosyayı kaldır"
                      title="Kaldır"
                    >
                      <X size={14} />
                    </button>

                    {item.url ? (
                      <img
                        src={item.url}
                        alt={item.file.name}
                        className="h-28 w-full rounded-xl object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-xl bg-gray-100">
                        <FileText size={36} className="text-gray-400" />
                      </div>
                    )}

                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium truncate text-gray-900">
                        {item.file.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUBMIT */}
           <button
              onClick={analyze}
              disabled={!files.length || loading}
              className="w-full rounded-2xl bg-indigo-600 py-4 text-white font-semibold transition hover:bg-indigo-700 disabled:opacity-40"
            >
              {loading
                ? "Denetçi Analizi Yapılıyor…"
                : hasAnnualPlan(files)
                ? "Denetçi Analizini Başlat"
                : "Yine de Analizi Başlat"}
            </button>

          </section>
        )}

        {loading && analysisDelayNotice && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800 space-y-1">
            <p className="font-semibold">
              🔍 Analiz beklenenden uzun sürüyor
            </p>
            <p>
              Belgeler detaylı incelendiği için işlem süresi uzayabilir.
              Lütfen sayfayı kapatmayın, analiz devam ediyor.
            </p>
            <p className="text-xs text-blue-700">
              Büyük dosyalar ve fotoğraflar bu duruma sebep olabilir.
            </p>
          </div>
        )}
      {/* ANALYSIS REPORT */}
      {analysis && (
        <div className="space-y-10">

          <AssistantPanel analysis={analysis} />

          <ReportHeader year={analysis.year} />
          <ReportSummary summary={analysis.summary} />

          <DocumentAnalysis items={analysis.items} />

          <ActionList
            actions={analysis.actions}
            onApply={applyAction}
          />

          {/* ACTION CTA – DOĞRU YER */}
          <div className="rounded-2xl border bg-indigo-50 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-semibold text-indigo-900">
                Plan Revizyon Aksiyonları
              </p>
              <p className="text-sm text-indigo-700 max-w-xl">
                Yukarıdaki kritik bulgulara karşılık gelen düzeltici aksiyonlar
                sistem tarafından oluşturulacak ve yıllık planınızın
                denetimde savunulabilir hâle gelmesi sağlanacaktır.
              </p>
            </div>

            <button
              onClick={createActionPlan}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 whitespace-nowrap"
            >
              Aksiyon Planını Oluştur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
