// APP/app/admin/templates/ocr/ocrStore.ts
"use client";

import { create } from "zustand";

/* ===================== */
/* ===== Types ===== */
/* ===================== */

export type OCRDocumentType =
  | "template"              // mevcut şablon üretimi
  | "safety_photo"          // 📸 sahadan fotoğraf → DÖF
  | "inspection_report"     // 📄 denetim tutanağı
  | "training_attendance";  // 🎓 eğitim katılım listesi

interface OCRState {
  /* ===== Raw OCR ===== */
  ocr_raw: string | null;
  ocr_clean: any | null;

  /* ===== AI Interpretation ===== */
  documentType: OCRDocumentType | null;

  /* ===== Outputs (senaryoya göre) ===== */
  template: any | null;          // mevcut kullanım
  dofDrafts: any[] | null;       // foto / denetim → DÖF taslakları
  trainingDraft: any | null;     // eğitim listesi taslağı

  /* ===== Actions ===== */
  setAll: (data: Partial<OCRState>) => void;
  reset: () => void;
}

/* ===================== */
/* ===== Store ===== */
/* ===================== */

export const useOCRStore = create<OCRState>((set) => ({
  /* ===== Initial State ===== */
  ocr_raw: null,
  ocr_clean: null,
  documentType: null,

  template: null,
  dofDrafts: null,
  trainingDraft: null,

  /* ===== Set (Partial – kırmadan genişletir) ===== */
  setAll: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),

  /* ===== Reset ===== */
  reset: () =>
    set({
      ocr_raw: null,
      ocr_clean: null,
      documentType: null,
      template: null,
      dofDrafts: null,
      trainingDraft: null,
    }),
}));
