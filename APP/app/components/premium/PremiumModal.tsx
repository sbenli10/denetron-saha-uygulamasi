"use client";

export default function PremiumModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96">
        <h2 className="text-xl font-semibold">Premium Özellik</h2>
        <p className="text-sm mt-2 text-gray-600">
          Bu özellik yalnızca Premium organizasyonlar tarafından kullanılabilir.
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-primary text-white py-2 rounded-md"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
