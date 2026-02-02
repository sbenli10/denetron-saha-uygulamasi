"use client";

import { AlertTriangle, Brain, FileCheck } from "lucide-react";

type Props = {
  criticalCount: number;
  ocrWarning: boolean;
  meta: {
    aiUsed: boolean;
  };
};

export default function AssistantIntro({
  criticalCount,
  ocrWarning,
  meta,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 space-y-4">
      <div className="flex items-center gap-2 text-indigo-600 font-medium">
        <Brain size={20} />
        İSG Denetçi Asistanı
      </div>

      {!meta.aiUsed && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm">
          ⚠️ Yapay zekâ servisi şu anda yoğun.
          <br />
          Analiz kural bazlı tamamlandı.
          <br />
          İstersen birkaç dakika sonra tekrar deneyebiliriz.
        </div>
      )}

      <p className="text-gray-800">
        Belgelerinizi inceledim. Denetimde sorun yaratabilecek{" "}
        <strong>{criticalCount} kritik nokta</strong> tespit ettim.
        Bunları birlikte ele alarak denetim riskini düşürebiliriz.
      </p>

      {ocrWarning && (
        <div className="flex gap-3 items-start rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          <AlertTriangle size={18} className="mt-0.5" />
          <div>
            <strong>OCR Uyarısı:</strong> Bazı belgelerde okunabilirlik düşük.
            Mobil çekimlerde bulanıklık veya düşük ışık tespit edildi.
            Denetimde belgeye ilişkin soru gelmemesi için gerekirse daha net
            görüntüyle tekrar yükleyebilirsin.
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <FileCheck size={14} />
        Denetim izi tutulur. Her bulgu ilgili belge ve OCR çıktısı ile ilişkilidir.
      </div>
    </div>
  );
}
