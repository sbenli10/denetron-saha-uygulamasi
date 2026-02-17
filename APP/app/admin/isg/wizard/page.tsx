"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  FileText,
  GraduationCap,
  ArrowRight,
  ShieldCheck, // yeni ikon
} from "lucide-react";

type Choice =
  | "photo"
  | "inspection"
  | "training"
  | "risk-analysis"   // ✅ yeni eklendi
  | null;

export default function ISGWizardPage() {
  const router = useRouter();
  const [choice, setChoice] = useState<Choice>(null);

  function goNext() {
    if (!choice) return;

    if (choice === "photo") {
      router.push("/admin/isg/photo");
    }

    if (choice === "inspection") {
      router.push("/admin/isg/inspection");
    }

    if (choice === "training") {
      router.push("/admin/isg/training");
    }

    if (choice === "risk-analysis") {
      router.push("/admin/isg/risk-analysis"); // ✅ yeni route
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-10 space-y-10">

        {/* HEADER */}
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">
            Ne yüklemek istiyorsunuz?
          </h1>
          <p className="text-gray-600">
            Belge veya görsele göre sizi doğru analiz ekranına yönlendireceğiz.
          </p>
        </header>

        {/* OPTIONS */}
        <div className="space-y-4">

          <Option
            active={choice === "photo"}
            icon={<Camera />}
            title="Sahada çekilmiş fotoğraf"
            desc="Makine, çalışan, ortam veya uygunsuzluk görseli"
            onClick={() => setChoice("photo")}
          />

          <Option
            active={choice === "inspection"}
            icon={<FileText />}
            title="Denetim tutanağı / rapor"
            desc="PDF, taranmış belge veya fotoğraf"
            onClick={() => setChoice("inspection")}
          />

          <Option
            active={choice === "training"}
            icon={<GraduationCap />}
            title="Eğitim katılım listesi"
            desc="İmzalı eğitim formları"
            onClick={() => setChoice("training")}
          />

          {/* ✅ YENİ RİSK ANALİZİ KARTI */}
          <Option
            active={choice === "risk-analysis"}
            icon={<ShieldCheck />}
            title="Risk Analizi (Excel / Tablo)"
            desc="Fine-Kinney veya genel risk analiz dosyası"
            onClick={() => setChoice("risk-analysis")}
          />

        </div>

        {/* ACTION */}
        <button
          onClick={goNext}
          disabled={!choice}
          className="
            w-full flex items-center justify-center gap-2
            py-4 rounded-xl font-medium text-white
            bg-indigo-600 hover:bg-indigo-700
            disabled:opacity-40
          "
        >
          Devam Et
          <ArrowRight size={18} />
        </button>

      </div>
    </div>
  );
}

/* ---------------------------------------
   OPTION COMPONENT
--------------------------------------- */

function Option({
  icon,
  title,
  desc,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border
        flex items-start gap-4 transition
        ${
          active
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-200 bg-white hover:bg-gray-50"
        }
      `}
    >
      <div className="text-indigo-600 mt-1">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500 mt-1">
          {desc}
        </p>
      </div>
    </button>
  );
}
