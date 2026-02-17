//APP\app\admin\premium\ocr\dashboard\page.tsx
"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  FileText,
  ClipboardList,
  GraduationCap,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import { ThisMonthWidget } from "./components/ThisMonthWidget";

/* --------------------------------------------------------
   CARD BASE
-------------------------------------------------------- */
const cardBase =
  "relative rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl " +
  "border border-black/5 dark:border-white/10 " +
  "shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all";

/* --------------------------------------------------------
   MAIN PAGE
-------------------------------------------------------- */
export default function ISGAssistantDashboard() {
  const [planItems, setPlanItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnualPlan() {
      try {
        const res = await fetch(
          "/api/admin/isg/analyze/annual-plan/latest"
        );
        if (!res.ok) return;

        const data = await res.json();
        setPlanItems(data?.result?.planItems || []);
      } catch (err) {
        console.error("Annual plan fetch failed", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnualPlan();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F6FB] to-[#E7EAF1] dark:from-[#0B0C10] dark:to-[#05060A] text-gray-900 dark:text-white">
      <BackgroundGlow />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-16 space-y-20">
        <Hero />

        {/* WIZARD CTA */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#A0A7B8]">
          <HelpCircle size={16} />
          <Link
            href="/admin/isg/wizard"
            className="text-indigo-600 font-medium hover:underline"
          >
            Hangi belgeyi yüklemem gerektiğinden emin değilim →
          </Link>
        </div>

        {/* ================= ISG DASHBOARD CARDS ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

          <ActionCard
            icon={<ClipboardList size={30} />}
            title="Yıllık İSG Çalışma Planı"
            desc="6331 kapsamında zorunlu ana plan dokümanı"
            help="Faaliyet takvimi, periyotlar, sorumlular ve yasal yükümlülükler ISO 45001 perspektifiyle analiz edilir."
            href="/admin/isg/annual-plan"
          />

          <ActionCard
            icon={<GraduationCap size={30} />}
            title="Yıllık Eğitim Planı"
            desc="Yasal süre ve tekrar yükümlülüğü kontrolü"
            help="Eğitim konuları ve tekrar süreleri mevzuata uygunluk açısından değerlendirilir."
            href="/admin/isg/training"
          />

          <ActionCard
            icon={<ShieldCheck size={30} />}
            title="Risk Analizi (Fine–Kinney)"
            desc="Risk skor doğrulama ve önceliklendirme"
            help="Risk değerleri yeniden hesaplanır ve kritik riskler önceliklendirilir."
            href="/admin/isg/risk-analysis"
          />

          <ActionCard
            icon={<Camera size={30} />}
            title="Saha Görsel Analizi"
            desc="AI destekli tehlike ve risk tespiti"
            help="Fotoğraflardaki tehlikeler analiz edilir ve aksiyon önerileri üretilir."
            href="/admin/isg/photo"
          />

          <ActionCard
            icon={<FileText size={30} />}
            title="Belgeden Akıllı Şablon"
            desc="Tekrarlayan süreçleri standardize edin"
            help="Belgeler analiz edilerek tekrar kullanılabilir şablonlar oluşturulur."
            href="/admin/premium/ocr/create"
          />

        </section>



        {/* THIS MONTH WIDGET */}
        {!loading && planItems.length > 0 && (
          <ThisMonthWidget items={planItems} />
        )}

        {/* AI VALUE */}
        <section className={`${cardBase} p-10 space-y-6`}>
          <h2 className="text-2xl font-semibold">
            Yapay Zekâ Bu Belgelerde Ne Yapar?
          </h2>

          <ul className="space-y-4 text-gray-700 dark:text-[#A0A7B8]">
            <li>• Yıllık planlarda eksik veya mevzuata aykırı noktaları bulur</li>
            <li>• Düzenleyici Önleyici Faaliyet Raporu otomatik üretir ve risk seviyelendirir</li>
            <li>• Eğitim tekrar sürelerini ve zorunlulukları kontrol eder</li>
            <li>• Denetimde sorulacak sorulara hazır hale getirir</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

/* --------------------------------------------------------
   HERO
-------------------------------------------------------- */
function Hero() {
  return (
    <section className="space-y-4">
      <h1 className="text-5xl font-semibold tracking-tight">
        Yapay Zekâ Destekli İSG Yönetim Platformu
      </h1>
      <span className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1 text-sm font-medium text-indigo-700">
        AI-Powered | ISO 45001 Referanslı | Denetim Hazırlık Sistemi
      </span>

      <p className="max-w-3xl text-xl text-gray-600 dark:text-[#A0A7B8]">
        ISO 45001 ve 6331 sayılı İş Sağlığı ve Güvenliği Kanunu referanslı
        akıllı analiz motoru ile planlarınızı değerlendirin,
        riskleri puanlayın, uygunsuzlukları tespit edin
        ve kurumsal uyumluluğunuzu dijital olarak yönetin.
      </p>
    </section>
  );
}


/* --------------------------------------------------------
   ACTION CARD
-------------------------------------------------------- */
function ActionCard({
  icon,
  title,
  desc,
  help,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  help: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`${cardBase} p-8 group hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-indigo-600">{icon}</div>

          <div className="relative">
            <HelpCircle
              size={18}
              className="text-gray-400 group-hover:text-gray-600"
            />
            <div className="absolute right-0 top-7 z-20 hidden w-64 rounded-xl bg-white text-gray-700 text-xs p-4 shadow-xl border border-gray-200 group-hover:block">
              {help}
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-[#A0A7B8]">{desc}</p>

        <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
          Başla <ChevronRight size={16} />
        </div>
      </div>
    </Link>
  );
}

/* --------------------------------------------------------
   BACKGROUND
-------------------------------------------------------- */
function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute w-[600px] h-[600px] -top-40 -left-40 bg-indigo-400/15 blur-[180px] rounded-full" />
      <div className="absolute w-[500px] h-[500px] bottom-[-200px] right-[-160px] bg-cyan-400/15 blur-[200px] rounded-full" />
    </div>
  );
}
