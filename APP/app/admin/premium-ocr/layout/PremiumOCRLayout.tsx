// app/admin/premium-ocr/layout/PremiumOCRLayout.tsx
export default function PremiumOCRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 px-10 py-8">

      {/* HEADER (CHROME, NOT PANEL) */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">
          Premium OCR
        </h1>

        <span className="text-xs bg-yellow-600/90 text-white px-3 py-1 rounded-md">
          Premium
        </span>
      </div>

      {children}
    </div>
  );
}
