//APP\app\components\operator\InspectionSummary.tsx
"use client";

import Image from "next/image";
import { CheckCircle, AlertCircle } from "lucide-react";

export interface InspectionResult {
  id: string;
  question: string;
  answer: "yes" | "no";
  finding?: {
    text: string;
    photo?: string; // blob base64'e dönüştürülmüş halde gelecek
  };
}

export default function InspectionSummary({
  results,
  onFinish,
}: {
  results: InspectionResult[];
  onFinish: () => void;
}) {
  return (
    <div className="flex flex-col w-full gap-6">

      {/* Banner */}
      <div className="w-full h-[80px] rounded-xl bg-success/10 border border-success/30 flex items-center gap-3 px-4">
        <CheckCircle className="h-8 w-8 text-success" />
        <div className="flex flex-col">
          <span className="text-[16px] text-white font-semibold">Denetim Tamamlandı</span>
          <span className="text-[13px] text-white/70">Özet aşağıdadır</span>
        </div>
      </div>

      {/* RESULTS */}
      <div className="flex flex-col gap-4">
        {results.map((res) => (
          <div
            key={res.id}
            className="w-full bg-bg800 rounded-xl p-4 border border-bg700"
          >
            <p className="text-[15px] text-white mb-3">{res.question}</p>

            {res.answer === "yes" ? (
              <div className="flex items-center gap-2 text-success font-medium">
                <CheckCircle className="h-5 w-5" />
                <span>Uygun</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-danger font-medium mb-3">
                <AlertCircle className="h-5 w-5" />
                <span>Uygun Değil</span>
              </div>
            )}

            {/* FINDING DETAILS */}
            {res.finding && (
              <div className="ml-2 mt-2 p-3 rounded-lg bg-bg900 border border-bg700">
                <p className="text-[13px] text-white/80 mb-2">
                  {res.finding.text}
                </p>

                {res.finding.photo && (
                  <Image
                    src={res.finding.photo}
                    width={100}
                    height={100}
                    alt="bulgu fotoğrafı"
                    className="rounded-xl border border-bg700"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FINISH BUTTON */}
      <button
        onClick={onFinish}
        className="w-full h-[60px] bg-primary rounded-xl text-white font-semibold text-[16px] shadow-lg active:bg-primary-dark"
      >
        Denetimi Bitir & Kaydet
      </button>
    </div>
  );
}
