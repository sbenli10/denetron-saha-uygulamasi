"use client";

import { useState } from "react";

export type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  is_locked?: boolean;
};

export default function FolderTree({
  folders,
  current,
  onSelect,
  onRename,
  onDelete,
  onMove,
  onCreateChild, // 👈 YENİ
  parentId = null,
  level = 0,
}: {
  folders: Folder[];
  current: string | null;
  onSelect: (id: string | null) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, newParent: string | null) => void;
  onCreateChild: (parentId: string) => void;
  parentId?: string | null;
  level?: number;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [context, setContext] = useState<{
    x: number;
    y: number;
    folder: Folder;
  } | null>(null);

  const children = folders.filter(f => f.parent_id === parentId);
  if (children.length === 0) return null;

  function toggle(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /* ================= KİLİTLİ KLASÖR SEÇİMİ ================= */

  async function handleSelect(folder: Folder) {
    if (!folder.is_locked) {
      onSelect(folder.id);
      return;
    }

    const password = prompt("Bu klasör kilitli. Şifre girin:");
    if (!password) return;

    const res = await fetch("/api/admin/library/folders/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder_id: folder.id,
        password,
      }),
    }).then(r => r.json());

    if (res.success) {
      onSelect(folder.id);
    } else {
      alert("Şifre yanlış");
    }
  }

  return (
    <div className="space-y-1 relative">
      {children.map(folder => {
        const hasChildren = folders.some(f => f.parent_id === folder.id);
        const isCollapsed = collapsed.has(folder.id);

        return (
          <div key={folder.id}>
            <div
              draggable
              onDragStart={e => {
                e.dataTransfer.setData("folderId", folder.id);
              }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                const draggedId = e.dataTransfer.getData("folderId");
                if (draggedId && draggedId !== folder.id) {
                  onMove(draggedId, folder.id);
                }
              }}
              onContextMenu={e => {
                e.preventDefault();
                setContext({
                  x: e.clientX,
                  y: e.clientY,
                  folder,
                });
              }}
              className={`flex items-center gap-2 text-sm w-full px-2 py-1 rounded-md cursor-pointer
                ${
                  current === folder.id
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => handleSelect(folder)}
            >
              {/* Expand / Collapse */}
              {hasChildren ? (
                <span
                  onClick={e => {
                    e.stopPropagation();
                    toggle(folder.id);
                  }}
                  className="w-4 text-center select-none"
                >
                  {isCollapsed ? "▶" : "▼"}
                </span>
              ) : (
                <span className="w-4" />
              )}

              📁 {folder.name}
              {folder.is_locked && <span className="ml-1 text-xs">🔒</span>}
            </div>

            {/* CHILDREN */}
            {!isCollapsed && (
              <FolderTree
                folders={folders}
                current={current}
                onSelect={onSelect}
                onRename={onRename}
                onDelete={onDelete}
                onMove={onMove}
                onCreateChild={onCreateChild} // 👈 KRİTİK SATIR
                parentId={folder.id}
                level={level + 1}
              />
            )}
          </div>
        );
      })}

      {/* ================= CONTEXT MENU ================= */}
      {context && (
        <div
          className="fixed z-50 bg-white border rounded-md shadow-md text-sm"
          style={{ top: context.y, left: context.x }}
          onMouseLeave={() => setContext(null)}
        >
          <button
            onClick={() => {
              onRename(context.folder.id);
              setContext(null);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Yeniden Adlandır
          </button>

          <button
            onClick={() => {
              onDelete(context.folder.id);
              setContext(null);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
          >
            Sil
          </button>

          <button
            onClick={() => {
              onMove(context.folder.id, null);
              setContext(null);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Klasörü Taşı
          </button>

          {/* 🔒 KLASÖRÜ KİLİTLE */}
          {!context.folder.is_locked && (
            <button
              onClick={async () => {
                const password = prompt("Bu klasör için bir şifre belirleyin:");
                if (!password) return;

                await fetch("/api/admin/library/folders/lock", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    folder_id: context.folder.id,
                    password,
                  }),
                });

                setContext(null);
                location.reload(); // veya fetchFolders()
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              🔒 Klasörü Kilitle
            </button>
          )}

          <button
            onClick={() => {
              onCreateChild(context.folder.id);
              setContext(null);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 font-medium"
          >
            ➕ Alt Klasör Oluştur
          </button>

        </div>
      )}
    </div>
  );
}
