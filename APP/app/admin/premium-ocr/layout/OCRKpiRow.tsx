// APP\app\admin\premium-ocr\layout\OCRKpiRow.tsx
import OCRKpiCard from "./OCRKpiCard";

export default function OCRKpiRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <OCRKpiCard label="OCR İşlemleri" value="4.312" change="+%12" />
      <OCRKpiCard label="OCR Doğruluğu" value="%96.4" change="+%3" />
      <OCRKpiCard label="Aktif Kullanıcı" value="Said B." />
      <OCRKpiCard label="AI Şablonları" value="38" change="+%5" />
    </div>
  );
}
