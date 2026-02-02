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

  /* =========================
     FETCH FOLDERS
  ========================= */
  async function fetchFolders() {
    const res = await fetch("/api/admin/library/folders");
    const data = await res.json();
    setFolders(data.folders || []);
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
    const fd = new FormData();
    fd.append("file", file);
    if (currentFolder) fd.append("folder_id", currentFolder);

    await fetch("/api/admin/library/upload", {
      method: "POST",
      body: fd,
    });

    await fetchFiles();
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          📚 Kurumsal Dosya Kütüphanesi
        </h1>

        <input
          placeholder="🔍 Dosya, etiket veya tür ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-64"
        />
      </div>

      <LibraryToolbar
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        onCreateFolder={createFolder}
        onUpload={uploadFile}
      />

      <div className="grid grid-cols-12 gap-6">
        {/* FOLDER TREE */}
        <aside className="col-span-3 bg-white border rounded-xl p-4">
          <FolderTree
            folders={folders}
            current={currentFolder}
            onSelect={setCurrentFolder}
            onRename={renameFolder}
            onDelete={deleteFolder}
            onMove={moveFolder}
            onCreateChild={createChildFolder} // 👈 EKLENDİ
          />

        </aside>

        {/* FILE GRID */}
        <main className="col-span-9 bg-white border rounded-xl p-4">
          {loading ? (
            <p className="text-sm text-gray-400">Yükleniyor…</p>
          ) : (
            <FileGrid files={files} />
          )}
        </main>
      </div>
    </div>
  );
}
