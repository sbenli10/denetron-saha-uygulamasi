//APP\app\admin\isg\training\[executionId]\page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle,
  User,
  Clock,
  Brain,
  Layers,
} from "lucide-react";
import Link from "next/link";

/* ================= TYPES ================= */

type Execution = {
  activity: string;
  planned_period: string;
  planned_month: number;
  executed_at?: string;
};

type TrainingRecord = {
  training_type: string | null;
  participant_type: string | null;
  participant_count: number | null;
  trainer_name: string | null;
  training_date: string | null;
  duration_hours: number | null;
  ai_note: string | null;
};

type EvidenceFile = {
  id: string;
  file_url: string;
  file_type: string;
};

/* ================= HELPERS ================= */

function getPublicUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/evidences/${path}`;
}

/* ================= PAGE ================= */

export default function TrainingDetailPage() {
  const { executionId } = useParams<{ executionId: string }>();

  const [execution, setExecution] = useState<Execution | null>(null);
  const [record, setRecord] = useState<TrainingRecord | null>(null);
  const [evidences, setEvidences] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState(true);

  const isPreCompliant =
  evidences.length > 0 &&
  (record?.duration_hours ?? 0) > 0;


  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/admin/isg/analyze/annual-plan/training-record?execution_id=${executionId}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      setExecution(json.execution);
      setRecord(json.record);
      setEvidences(json.evidences ?? []);
      setLoading(false);
    }
    load();
  }, [executionId]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Yükleniyor…
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="p-12 text-center text-red-600">
        Eğitim kaydı bulunamadı.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      {/* ================= HEADER ================= */}
      <header className="space-y-2">
        <Link
          href="/admin/isg/training/todo"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:underline"
        >
          <ArrowLeft size={14} /> Eğitim Takibine Dön
        </Link>

        <h1 className="text-3xl font-semibold text-gray-900">
          {execution.activity}
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar size={14} /> {execution.planned_period}
          </span>
          <span className="flex items-center gap-1">
            <Layers size={14} /> {execution.planned_month}. Ay
          </span>
        </div>
      </header>

      {/* ================= STATUS ================= */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 flex gap-4">
        <CheckCircle className="text-green-700 mt-0.5" />
        <div>
          <p className="font-medium text-green-800">
            Eğitim gerçekleştirilmiş ve sistemde resmi olarak kayıt altına alınmıştır.
          </p>
          {execution.executed_at && (
            <p className="text-sm text-green-700 mt-1">
              Gerçekleşme Tarihi:{" "}
              {new Date(execution.executed_at).toLocaleDateString("tr-TR")}
            </p>
          )}
        </div>
      </div>

      {isPreCompliant && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex gap-3">
          <CheckCircle className="text-green-700 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-green-800">
              Mevzuat Ön Değerlendirmesi
            </p>
            <p className="text-sm text-green-700">
              Bu eğitim, yüklenen bilgiler ve kanıtlar esas alınarak
              İSG mevzuatındaki temel gerekliliklerle uyumlu görünmektedir.
            </p>
            <p className="text-xs text-green-700/80">
              Nihai uygunluk değerlendirmesi işveren ve İSG uzmanı sorumluluğundadır.
            </p>
          </div>
        </div>
      )}


      {/* ================= TRAINING RECORD ================= */}
      {record && (
        <section className="rounded-xl border bg-white p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">
            Gerçekleşen Eğitim Detayları
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
            {record.training_type && (
              <div>
                <strong>Eğitim Türü</strong>
                <div>{record.training_type}</div>
              </div>
            )}

            {record.participant_type && (
              <div>
                <strong>Katılım</strong>
                <div>{record.participant_type}</div>
              </div>
            )}

            {record.participant_count !== null && (
              <div>
                <strong>Katılımcı Sayısı</strong>
                <div>{record.participant_count}</div>
              </div>
            )}

            {record.trainer_name && (
              <div className="flex items-start gap-2">
                <User size={16} className="mt-1" />
                <div>
                  <strong>Eğitimi Veren</strong>
                  <div>{record.trainer_name}</div>
                </div>
              </div>
            )}

            {record.duration_hours !== null && (
              <div className="flex items-start gap-2">
                <Clock size={16} className="mt-1" />
                <div>
                  <strong>Süre</strong>
                  <div>{record.duration_hours} saat</div>
                </div>
              </div>
            )}
          </div>

          {record.ai_note && (
            <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm flex gap-2">
              <Brain size={16} className="text-blue-600 mt-0.5" />
              {record.ai_note}
            </div>
          )}
        </section>
      )}

      {/* ================= EVIDENCE CENTER ================= */}
      <section className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-gray-900">
          <FileText size={18} />
          Eğitimin Gerçekleştiğine Dair Kanıtlar
        </h2>

        {evidences.length === 0 ? (
          <p className="text-sm text-gray-500">
            Bu eğitim için sistemde kayıtlı kanıt bulunmamaktadır.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {evidences.map((e) => {
              const url = getPublicUrl(e.file_url);

              if (e.file_type.startsWith("image/")) {
                return (
                  <a
                    key={e.id}
                    href={url}
                    target="_blank"
                    className="block rounded-lg border overflow-hidden hover:shadow"
                  >
                    <img
                      src={url}
                      className="h-32 w-full object-cover"
                    />
                  </a>
                );
              }

              return (
                <a
                  key={e.id}
                  href={url}
                  target="_blank"
                  className="h-32 flex items-center justify-center border rounded-lg bg-gray-50 text-sm"
                >
                  📎 Dosyayı Aç
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= FOOTER ================= */}
      <div className="text-xs text-gray-500">
        Bu eğitim kaydı Denetron sistemi tarafından oluşturulmuştur ve
        iş sağlığı ve güvenliği denetimlerinde resmi kanıt olarak kullanılabilir.
      </div>
    </div>
  );
}
