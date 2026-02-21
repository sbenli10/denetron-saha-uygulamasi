"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Trash2, 
  ExternalLink, 
  Download, 
  Star, 
  CheckCircle2, 
  MoreVertical, 
  History,
  Share2,
  Edit3
} from "lucide-react";

/* ---------------- TYPES ---------------- */

export type FileItem = {
  id: string;
  file_url: string;
  mime_type: string | null;
  name: string;
  tags?: string[];
  is_starred?: boolean; // ⭐ Yıldız durumu
  version?: number;     // 📄 Sürüm numarası
  storage_path?: string; 
};

interface FileGridProps {
  files: FileItem[];
  selectedIds: string[]; // 📂 Toplu seçim için
  onSelect: (id: string) => void;
  onStar: (id: string, currentState: boolean) => void;
  onDelete: (fileId: string, storagePath?: string) => void;
  onRename: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onViewHistory: (file: FileItem) => void;
}

/* ---------------- COMPONENT ---------------- */

export default function FileGrid({ 
  files, 
  selectedIds, 
  onSelect, 
  onStar, 
  onDelete,
  onRename,
  onShare,
  onViewHistory
}: FileGridProps) {
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-xl border border-dashed">
        <FileText className="text-slate-300 mb-3" size={48} />
        <p className="text-sm text-slate-500 font-medium">Bu klasörde henüz dosya yok</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 select-none">
      {files.map((file) => {
        const isImage = file.mime_type?.startsWith("image");
        const isSelected = selectedIds.includes(file.id);

        return (
          <div
            key={file.id}
            onContextMenu={(e) => {
              e.preventDefault();
              setActiveMenu(file.id);
            }}
            className={`group relative border rounded-xl p-3 bg-white transition-all duration-300 shadow-sm
              ${isSelected ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500" : "border-slate-200 hover:shadow-lg hover:border-blue-200"}
            `}
          >
            {/* TOP BAR: CHECKBOX & STAR */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                onClick={() => onSelect(file.id)}
                className={`p-1 rounded-md transition-colors ${isSelected ? "text-blue-600 opacity-100" : "text-slate-400 bg-white shadow-sm hover:text-blue-500"}`}
               >
                 <CheckCircle2 size={18} fill={isSelected ? "currentColor" : "none"} />
               </button>
            </div>

            <button 
              onClick={() => onStar(file.id, !!file.is_starred)}
              className={`absolute top-2 right-2 z-10 p-1 rounded-md transition-all
                ${file.is_starred ? "text-amber-500 opacity-100" : "text-slate-300 opacity-0 group-hover:opacity-100 hover:text-amber-400"}
              `}
            >
              <Star size={18} fill={file.is_starred ? "currentColor" : "none"} />
            </button>

            {/* PREVIEW AREA */}
            <div className="relative h-32 rounded-lg overflow-hidden bg-slate-100 mb-3 cursor-pointer" onClick={() => onSelect(file.id)}>
              {isImage ? (
                <img
                  src={file.file_url}
                  alt={file.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-blue-50/50">
                  <FileText className="text-blue-200" size={40} />
                </div>
              )}
              
              {/* VERSION BADGE */}
              {file.version && file.version > 1 && (
                <div className="absolute bottom-1 right-1 bg-slate-800/70 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                  v{file.version}
                </div>
              )}
            </div>

            {/* FILE INFO */}
            <div className="space-y-1 px-1">
              <h3 
                className="text-[11px] font-bold text-slate-700 truncate block w-full leading-tight" 
                title={file.name}
              >
                {file.name}
              </h3>
              <div className="flex items-center justify-between">
               {/* Uzantı Bölümü - Sıkışmaması için flex-shrink-0 ekledik */}
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-tighter truncate flex-shrink-0">
                  {file.mime_type?.split('/')[1]?.substring(0, 4) || 'DOC'}
                </span>
                
                {/* QUICK ACTIONS DROPDOWN TRIGGER */}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Kartın seçilmesini engellemek için
                      setActiveMenu(activeMenu === file.id ? null : file.id);
                    }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {/* CUSTOM CONTEXT MENU (POPOVER) */}
                  {activeMenu === file.id && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setActiveMenu(null)} />
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1 overflow-hidden animate-in fade-in zoom-in duration-150">
                        <button onClick={() => { onRename(file); setActiveMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                          <Edit3 size={14} /> Yeniden Adlandır
                        </button>
                        <button onClick={() => { onShare(file); setActiveMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50">
                          <Share2 size={14} /> Paylaş (Süreli Link)
                        </button>
                        <button onClick={() => { onViewHistory(file); setActiveMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                          <History size={14} /> Sürüm Geçmişi
                        </button>
                        <a href={file.file_url} target="_blank" className="w-full px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50">
                          <ExternalLink size={14} /> Yeni Sekmede Aç
                        </a>
                        <button onClick={() => { onDelete(file.id, file.storage_path); setActiveMenu(null); }} className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium">
                          <Trash2 size={14} /> Dosyayı Sil
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}