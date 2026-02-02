"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

const schema = z.object({
  location: z.string().min(3, "Lokasyon çok kısa"),
  equipment: z.string().min(2, "Ekipman adı çok kısa"),
  category: z.enum([
    "mechanical",
    "electrical",
    "fire",
    "chemical",
    "environmental",
    "safety",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SubmissionForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormData) {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const json = await res.json();

    if (!res.ok) {
      setMessage(json.error || "Kayıt eklenemedi.");
      setLoading(false);
      return;
    }

    setMessage("Denetim başarıyla kaydedildi! AI analizi başlatıldı.");
    reset();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* LOKASYON */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Lokasyon *</label>
        <input
          {...register("location")}
          className="w-full mt-1 px-4 py-2 rounded-lg border focus:ring-blue-500 focus:ring-2"
          placeholder="Örn: A Blok / Üretim Hattı"
        />
        {errors.location && (
          <p className="text-red-600 text-sm">{errors.location.message}</p>
        )}
      </div>

      {/* EQUIPMENT */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Ekipman *</label>
        <input
          {...register("equipment")}
          className="w-full mt-1 px-4 py-2 rounded-lg border focus:ring-blue-500 focus:ring-2"
          placeholder="Örn: Forklift / Merdiven / Elektrik Panosu"
        />
        {errors.equipment && (
          <p className="text-red-600 text-sm">{errors.equipment.message}</p>
        )}
      </div>

      {/* CATEGORY + SEVERITY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* CATEGORY */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Kategori *</label>
          <select
            {...register("category")}
            className="w-full mt-1 px-4 py-2 rounded-lg border bg-white"
          >
            <option value="mechanical">Mekanik</option>
            <option value="electrical">Elektrik</option>
            <option value="fire">Yangın</option>
            <option value="chemical">Kimyasal</option>
            <option value="environmental">Çevre</option>
            <option value="safety">Güvenlik</option>
          </select>

          {errors.category && (
            <p className="text-red-600 text-sm">{errors.category.message}</p>
          )}
        </div>

        {/* SEVERITY */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Şiddet *</label>
          <select
            {...register("severity")}
            className="w-full mt-1 px-4 py-2 rounded-lg border bg-white"
          >
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
            <option value="critical">Kritik</option>
          </select>

          {errors.severity && (
            <p className="text-red-600 text-sm">{errors.severity.message}</p>
          )}
        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Açıklama (Opsiyonel)</label>
        <textarea
          {...register("description")}
          rows={4}
          className="w-full mt-1 px-4 py-2 rounded-lg border focus:ring-blue-500 focus:ring-2"
          placeholder="Denetim ile ilgili detaylı açıklama..."
        />

        {errors.description && (
          <p className="text-red-600 text-sm">{errors.description.message}</p>
        )}
      </div>

      {/* STATUS MESSAGE */}
      {message && (
        <p className="text-center text-blue-600 font-medium">{message}</p>
      )}

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : (
          "Denetimi Kaydet"
        )}
      </button>
    </form>
  );
}
