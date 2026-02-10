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

        {/* CORE DOCUMENTS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ActionCard
            icon={<ClipboardList size={34} />}
            title="Yıllık İSG Çalışma Planı"
            desc="Ocak ayında revize edilen zorunlu plan"
            help="İSG faaliyetleri, periyotlar, sorumlular ve mevzuat uyumu otomatik analiz edilir."
            href="/admin/isg/annual-plan"
          />

          <ActionCard
            icon={<GraduationCap size={34} />}
            title="Yıllık Eğitim Planı"
            desc="Eğitim süreleri ve tekrar zorunlulukları"
            help="Eğitim konuları, süreler, muafiyetler ve eksikler tespit edilir."
            href="/admin/isg/training"
          />

          <ActionCard
            icon={<AlertTriangle size={34} />}
            title="DÖF / Uygunsuzluk Formu"
            desc="Asıl takip edilmesi gereken belge"
            help="Tespit edilen uygunsuzluklar için risk seviyesi, aksiyon ve takip oluşturur."
            href="/admin/isg/dof"
          />
        </section>

        {/* SUPPORTING INPUTS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ActionCard
            icon={<Camera size={34} />}
            title="Sahadan Fotoğraf (Destekleyici)"
            desc="Görsel kanıt ve risk destekleyici"
            help="Fotoğraflar doğrudan DÖF ve plan analizlerini destekler."
            href="/admin/isg/photo"
          />

          <ActionCard
            icon={<FileText size={34} />}
            title="Belgeden Şablon Oluştur"
            desc="Her yıl aynı formatı otomatikleştir"
            help="Yıllık plan ve DÖF formlarını tekrar tekrar kullanmak için şablon oluştur."
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
        İSG İş Asistanı
      </h1>
      <p className="max-w-3xl text-xl text-gray-600 dark:text-[#A0A7B8]">
        Yıllık İSG planları, eğitim dokümanları ve DÖF süreçlerini
        Yapay zekâ ile analiz edin, denetime hazır hale gelin.
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
