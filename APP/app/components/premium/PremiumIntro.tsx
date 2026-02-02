//APP\app\components\premium\PremiumIntro.tsx
export default function PremiumIntro() {
  return (
    <div className="p-10 text-center animate-fadeIn">
      <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
        Denetron Premium'a Hoş Geldiniz
      </div>

      <p className="mt-4 text-gray-500">
        OCR + AI gücünün birleştiği profesyonel analiz platformu.
      </p>

      <div className="mt-10">
        <img
          src="/animations/premium-ai.gif"
          className="mx-auto h-40 opacity-90"
        />
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <PremiumFeature title="AI Insights" desc="Verileriniz için öneri üretir." />
        <PremiumFeature title="OCR Template Builder" desc="OCR ile akıllı şablon üretin." />
        <PremiumFeature title="Risk Skoru" desc="AI otomatik risk hesaplama." />
      </div>
    </div>
  );
}

function PremiumFeature({ title, desc }: any) {
  return (
    <div className="p-4 border rounded-xl shadow-sm bg-white">
      <div className="font-semibold">{title}</div>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </div>
  );
}
