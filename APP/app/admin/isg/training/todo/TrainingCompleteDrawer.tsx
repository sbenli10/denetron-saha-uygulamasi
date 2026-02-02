//APP\app\admin\isg\training\todo\TrainingCompleteDrawer.tsx
"use client";

import { useState } from "react";
import {
  X,
  ShieldCheck,
  Upload,
  Brain,
  Loader2,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

type Props = {
  open: boolean;
  executionId: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
};

export function TrainingCompleteDrawer({
  open,
  executionId,
  onClose,
  onSubmitSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  /* OPSİYONEL ALANLAR */
  const [trainingType, setTrainingType] = useState("");
  const [participantType, setParticipantType] = useState("");
  const [participantCount, setParticipantCount] = useState<number | "">("");
  const [trainerName, setTrainerName] = useState("");
  const [trainingDate, setTrainingDate] = useState("");
  const [durationHours, setDurationHours] = useState<number | "">("");

  const [files, setFiles] = useState<File[]>([]);

  if (!open) return null;

  async function submit() {
    try {
      setLoading(true);

      const form = new FormData();
      form.append("execution_id", executionId);

      /* SADECE DOLU OLANLARI GÖNDER */
      if (trainingType) form.append("training_type", trainingType);
      if (participantType) form.append("participant_type", participantType);
      if (participantCount !== "")
        form.append("participant_count", String(participantCount));
      if (trainerName) form.append("trainer_name", trainerName);
      if (trainingDate) form.append("training_date", trainingDate);
      if (durationHours !== "")
        form.append("duration_hours", String(durationHours));

      files.forEach((f) => form.append("files", f));

      const res = await fetch(
        "/api/admin/isg/analyze/annual-plan/complete-training",
        { method: "POST", body: form }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Eğitim tamamlanamadı");
        return;
      }

      onSubmitSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* BACKDROP */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* DRAWER */}
      <div className="w-full max-w-xl bg-white h-full shadow-xl flex flex-col">
        {/* HEADER */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="text-green-600" />
            Eğitimi Resmi Olarak Tamamla
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* BİLGİ NOTU */}
          <div className="text-xs text-gray-500">
            Aşağıdaki alanların tamamı opsiyoneldir.  
            Eğitim, yüklenen kanıtlar esas alınarak kayıt altına alınır.
          </div>

          {/* Eğitim Türü */}
          <section>
            <label className="text-sm font-medium">Eğitim Türü (opsiyonel)</label>
            <input
              value={trainingType}
              onChange={(e) => setTrainingType(e.target.value)}
              placeholder="Örn: Zorunlu İSG Eğitimi"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </section>

          {/* Katılım */}
          <section>
            <label className="text-sm font-medium">Katılım Bilgisi (opsiyonel)</label>
            <input
              value={participantType}
              onChange={(e) => setParticipantType(e.target.value)}
              placeholder="Örn: Tüm çalışanlar"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </section>

          {/* Tarih & Süre */}
          <section className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Eğitim Tarihi</label>
              <input
                type="date"
                value={trainingDate}
                onChange={(e) => setTrainingDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm">Süre (saat)</label>
              <input
                type="number"
                value={durationHours}
                onChange={(e) =>
                  setDurationHours(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </section>

         {/* KANIT DOSYALARI */}
            <section>
            <label className="text-sm font-medium">Kanıt Dosyaları</label>

            <label className="border rounded-lg p-4 flex items-center gap-2 cursor-pointer mt-2">
                <Upload size={16} />
                Dosya Seç
                <input
                type="file"
                multiple
                hidden
                onChange={(e) => {
                    const selectedFiles = e.target.files;
                    if (!selectedFiles) return;

                    setFiles((prev) => [
                        ...prev,
                        ...Array.from(selectedFiles),
                    ]);
                }}
                />
            </label>

            {/* ÖN İZLEME + SİLME */}
            {files.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                {files.map((file, idx) => {
                    const url = URL.createObjectURL(file);

                    return (
                    <div
                        key={idx}
                        className="relative rounded-lg border overflow-hidden group"
                    >
                        {/* SİL BUTONU */}
                        <button
                        type="button"
                        onClick={() =>
                            setFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute top-1 right-1 z-10 rounded-full bg-black/60 text-white w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                        title="Dosyayı kaldır"
                        >
                        ✕
                        </button>

                        {/* IMAGE */}
                        {file.type.startsWith("image/") ? (
                        <img
                            src={url}
                            alt={file.name}
                            className="h-24 w-full object-cover"
                        />
                        ) : (
                        <div className="h-24 flex flex-col items-center justify-center bg-gray-50 text-xs text-gray-600 px-2 text-center">
                            <FileText size={18} />
                            <span className="truncate w-full">{file.name}</span>
                        </div>
                        )}
                    </div>
                    );
                })}
                </div>
            )}

            {files.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                Yanlış eklenen dosyalar üzerine gelinerek silinebilir.
                </p>
            )}
            </section>

          {/* AI (YORUMSUZ / BASKISIZ) */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <div className="flex items-center gap-2 mb-1 font-medium">
              <Brain size={16} /> Bilgilendirme
            </div>
            Eğitim kaydı, yüklenen kanıtlar esas alınarak oluşturulacaktır.
          </section>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border text-sm"
          >
            Vazgeç
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Eğitimi Resmi Olarak Tamamla
          </button>
        </div>
      </div>
    </div>
  );
}
