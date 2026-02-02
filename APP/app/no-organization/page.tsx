// APP/app/no-organization/page.tsx
"use client";

import Link from "next/link";
import { Building2, Mail, LogOut } from "lucide-react";

export default function NoOrganizationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">

        {/* ICON */}
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-indigo-50">
            <Building2 size={36} className="text-indigo-600" />
          </div>
        </div>

        {/* TITLE */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Organizasyon Bulunamadı
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Hesabınız başarıyla oluşturuldu ancak henüz herhangi bir
            organizasyona bağlı değilsiniz.
          </p>
        </div>

        {/* INFO BOX */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 space-y-2">
          <p>Bu durum genellikle şu sebeplerle oluşur:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Yönetici tarafından henüz davet edilmemiş olabilirsiniz</li>
            <li>Daveti farklı bir e-posta adresiyle almış olabilirsiniz</li>
            <li>Davet bağlantısının süresi dolmuş olabilir</li>
          </ul>
        </div>

        {/* ACTIONS */}
        <div className="space-y-3 pt-2">
          <a
            href="mailto:support@denetron.com"
            className="
              w-full inline-flex items-center justify-center gap-2
              px-4 py-3 rounded-xl
              bg-indigo-600 text-white font-medium
              hover:bg-indigo-700 transition
            "
          >
            <Mail size={18} />
            Destek ile İletişime Geç
          </a>

          <Link
            href="/login"
            className="
              w-full inline-flex items-center justify-center gap-2
              px-4 py-3 rounded-xl
              border border-slate-300 text-slate-700
              hover:bg-slate-50 transition
            "
          >
            <LogOut size={18} />
            Farklı Hesapla Giriş Yap
          </Link>
        </div>

        {/* FOOTER */}
        <p className="text-xs text-center text-slate-400 pt-2">
          Denetron • İş Sağlığı ve Güvenliği Dijital Asistanı
        </p>
      </div>
    </div>
  );
}
