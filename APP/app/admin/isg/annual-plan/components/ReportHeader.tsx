export default function ReportHeader({ year }: { year: number }) {
  return (
    <header>
      <h1 className="text-3xl font-semibold">
        🧠 İSG Denetçi Analiz Raporu
      </h1>
      <p className="text-gray-600 mt-1">
        {year} yılı – Yıllık İSG planı, eğitim planı ve EK-2 belgeleri birlikte değerlendirilmiştir.
      </p>
    </header>
  );
}
