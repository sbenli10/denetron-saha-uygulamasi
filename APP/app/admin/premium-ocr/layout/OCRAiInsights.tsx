// APP\app\admin\premium-ocr\layout\OCRAiInsights.tsx

export default function OCRAiInsights() {
  return (
    <div className="p-5 bg-white border rounded-xl shadow-md space-y-3">
      <h2 className="text-lg font-semibold">AI Insights</h2>

      <ul className="space-y-2 text-sm text-gray-700">
        <li>• Son hafta OCR doğruluğu %96 ile yüksek verimlilikte.</li>
        <li>• “Adres” alanında yinelenen tanıma hataları tespit edildi.</li>
        <li>• En verimli kullanıcı: Said B. (345 işlem)</li>
        <li>• “Fatura Tip-A” şablonu %98 başarı ile zirvede.</li>
      </ul>
    </div>
  );
}
