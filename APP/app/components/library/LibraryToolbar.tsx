//APP\app\components\library\LibraryToolbar.tsx
"use client";

export default function LibraryToolbar({
  newFolderName,
  setNewFolderName,
  onCreateFolder,
  onUpload,
}: {
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  onCreateFolder: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        value={newFolderName}
        onChange={e => setNewFolderName(e.target.value)}
        placeholder="Yeni klasör adı"
        className="border rounded-lg px-3 py-2 text-sm"
      />

      <button
        onClick={onCreateFolder}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
      >
        Klasör Oluştur
      </button>

      <label className="px-4 py-2 rounded-lg border text-sm cursor-pointer hover:bg-gray-50">
        Dosya Yükle
        <input
          type="file"
          hidden
          onChange={e => e.target.files && onUpload(e.target.files[0])}
        />
      </label>
    </div>
  );
}
