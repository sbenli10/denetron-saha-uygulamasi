// APP/app/admin/library/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import FolderTree, { Folder } from "@/app/components/library/FolderTree";
import FileGrid from "@/app/components/library/FileGrid";
import LibraryToolbar from "@/app/components/library/LibraryToolbar";

type FileItem = {
  id: string;
  name: string;
  file_url: string;
  mime_type: string | null;
  tags?: string[];
};

export default function LibraryPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const [newFolderName, setNewFolderName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  // APP/app/admin/library/page.tsx

// 1. Seçili dosya ID'lerini tutacak state
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// 2. Seçim mantığı
const handleToggleSelect = (id: string) => {
  setSelectedIds(prev => 
    prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
  );
};

// 3. Diğer aksiyonlar için fonksiyonlar (Şimdilik log basıyoruz, içlerini doldurabilirsin)
const handleStar = async (id: string, currentState: boolean) => {
  console.log("Yıldız durumu değişecek:", id, !currentState);
};

const handleRenameFile = (file: FileItem) => {
  const newName = prompt("Yeni dosya adı:", file.name);
  if (newName) console.log("Dosya adı değişecek:", file.id, newName);
};

const handleShareFile = (file: FileItem) => {
  alert(`Paylaşım linki oluşturuluyor: ${file.name}`);
};

const handleViewHistory = (file: FileItem) => {
  console.log("Sürüm geçmişi açılıyor:", file.id);
};
  /* =========================
     FETCH FOLDERS
  ========================= */
  async function fetchFolders() {
    const res = await fetch("/api/admin/library/folders");
    const data = await res.json();
    setFolders(data.folders || []);
  }

  // APP/app/admin/library/page.tsx

async function deleteFile(fileId: string) {
  const ok = confirm("Bu dosyayı silmek istediğinize emin misiniz?");
  if (!ok) return;

  try {
    const res = await fetch("/api/admin/library/files/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: fileId }),
    });

    if (res.ok) {
      await fetchFiles(); // ✅ Listeyi anında güncelle
    }
  } catch (error) {
    console.error("Dosya silme hatası:", error);
  }
}

  /* =========================
     FETCH FILES
  ========================= */
  async function fetchFiles() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFolder) params.set("folder_id", currentFolder);
      if (search) params.set("q", search);

      const res = await fetch(`/api/admin/library/search?${params}`);
      const data = await res.json();
      setFiles(data.files || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [currentFolder, search]);

  /* =========================
     CREATE ROOT FOLDER
  ========================= */
  async function createFolder() {
    if (!newFolderName.trim()) return;

    await fetch("/api/admin/library/folders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newFolderName,
        parent_id: null, // 🔒 her zaman root
      }),
    });

    setNewFolderName("");
    await fetchFolders();
  }

  async function renameFolder(folderId: string) {
  const newName = prompt("Yeni klasör adı?");
  if (!newName) return;

  await fetch("/api/admin/library/folders/rename", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: folderId,
      name: newName,
    }),
  });

  await fetchFolders();
}

async function deleteFolder(folderId: string) {
  const ok = confirm("Bu klasörü silmek istiyor musunuz?");
  if (!ok) return;

  await fetch("/api/admin/library/folders/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: folderId }),
  });

  setCurrentFolder(null);
  await fetchFolders();
}

async function moveFolder(folderId: string, parentId: string | null) {
  await fetch("/api/admin/library/folders/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: folderId,
      parent_id: parentId,
    }),
  });

  await fetchFolders();
}

async function createChildFolder(parentId: string) {
  const name = prompt("Alt klasör adı:");
  if (!name) return;

  await fetch("/api/admin/library/folders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      parent_id: parentId, // 👈 KRİTİK
    }),
  });

  await fetchFolders();
}


  /* =========================
     UPLOAD FILE
  ========================= */

  async function uploadFile(file: File) {
    setLoading(true); // Yükleme başladığında grid'i yükleniyor durumuna sokar
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (currentFolder) fd.append("folder_id", currentFolder);

      const res = await fetch("/api/admin/library/upload", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        // ✅ KRİTİK: Sayfa yenilenmeden dosyaları tekrar çek
        await fetchFiles(); 
        // İsteğe bağlı: Başarılı bildirimi göster
      }
    } catch (error) {
      console.error("Yükleme hatası:", error);
    } finally {
      setLoading(false); // İşlem bitince yükleniyor modundan çık
    }
  }
  /* =========================
     RENDER
  ========================= */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">
          📚 Kurumsal Dosya Kütüphanesi
        </h1>

        <input
          placeholder="🔍 Dosya, etiket veya tür ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full sm:w-72"
        />
      </div>

      {/* TOOLBAR */}
      <LibraryToolbar
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        onCreateFolder={createFolder}
        onUpload={uploadFile}
      />

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* FOLDER TREE */}
        <aside className="lg:col-span-3 bg-white border rounded-xl p-4">
          <FolderTree
            folders={folders}
            current={currentFolder}
            onSelect={setCurrentFolder}
            onRename={renameFolder}
            onDelete={deleteFolder}
            onMove={moveFolder}
            onCreateChild={createChildFolder}
          />
        </aside>
        {/* FILE GRID */}
        <main className="lg:col-span-9 bg-white border rounded-xl p-4 min-h-[200px]">
          {loading ? (
            <p className="text-sm text-gray-400 font-medium">Güncelleniyor…</p>
          ) : (
            <FileGrid 
              files={files} 
              selectedIds={selectedIds}
              onSelect={handleToggleSelect}
              onStar={handleStar}
              onRename={handleRenameFile}
              onShare={handleShareFile}
              onViewHistory={handleViewHistory}
              onDelete={deleteFile} 
            />
          )}
        </main>
      </div>
    </div>
  );

}
