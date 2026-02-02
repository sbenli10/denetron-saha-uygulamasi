//APP\app\admin\templates\[id]\edit\TemplateEditor.client.tsx
"use client";

import { useState } from "react";

import type { Field, TemplateVersion } from "./TemplateEditor.types";

import EditorFrame from "./EditorFrame";
import VersionSidebar from "./VersionSidebar";
import FloatingActions from "./FloatingActions";
import MobileBottomToolbar from "./MobileBottomToolbar";
import MobilePreviewModal from "./MobilePreviewModal";

/* -------------------------------------------------------------
 * TEMPLATE EDITOR MAIN COMPONENT
 * ------------------------------------------------------------- */
interface TemplateEditorProps {
  initial: {
    id: string;
    name: string;
    is_active: boolean;
    fields: Field[];
  };

  initialVersions: TemplateVersion[];

  onSaveServer: (fd: FormData) => Promise<any>;
  onCreateVersionServer: (templateId: string, fields: Field[]) => Promise<string>;
  onRestoreServer: (templateId: string, version: string) => Promise<Field[]>;
  onDeleteVersionServer?: (templateId: string, version: string) => Promise<void>;

  member: {
    role: string | null;
  } | null;

  /** 👑 YENİ */
  isPremium: boolean;
}


export default function TemplateEditor({
  initial,
  initialVersions,
  onSaveServer,
  onCreateVersionServer,
  onRestoreServer,
  onDeleteVersionServer,
  member,
  isPremium,
}: TemplateEditorProps) {

  /* -------------------------------------------------------------
   * STATE MANAGEMENT
   * ------------------------------------------------------------- */
  const [name, setName] = useState(initial.name);
  const [active, setActive] = useState(initial.is_active);

  const [fields, setFields] = useState<Field[]>(
    initial.fields.map((f) => ({
      ...f,
      __id: f.__id ?? crypto.randomUUID()
    }))
  );

  const [versions, setVersions] = useState<TemplateVersion[]>(initialVersions);

  /** 
   * Aktif (yüklenmiş) versiyon
   * null = henüz restore edilmemiş / ilk yükleme
   */
  const [activeVersion, setActiveVersion] = useState<string | null>(null);

  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  /* -------------------------------------------------------------
   * FIELD OPERATIONS
   * ------------------------------------------------------------- */
  const addField = (type: Field["type"]) => {
    const id = crypto.randomUUID();

    const base: Field =
      type === "divider"
        ? { __id: id, type: "divider", label: "Yeni Bölüm" }
        : type === "boolean"
        ? { __id: id, type: "boolean", key: "check.yeni", label: "Yeni Madde", critical: false }
        : type === "text"
        ? { __id: id, type: "text", key: "text.yeni", label: "Metin", placeholder: "" }
        : type === "textarea"
        ? { __id: id, type: "textarea", key: "note.yeni", label: "Not", maxLength: 300 }
        : { __id: id, type: "select", key: "select.yeni", label: "Seçim", default: "", options: [] };

    setFields((prev) => [...prev, base]);
  };

  const updateField = (index: number, patch: Partial<Field>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? ({ ...f, ...patch } as Field) : f))
    );
  };

  const removeField = (i: number) =>
    setFields((prev) => prev.filter((_, idx) => idx !== i));

  const duplicateField = (i: number) =>
    setFields((prev) => {
      const copy: Field = {
        ...(structuredClone(prev[i]) as Field),
        __id: crypto.randomUUID()
      };
      return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
    });

  const moveField = (i: number, dir: -1 | 1) =>
    setFields((prev) => {
      const next = i + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[i], arr[next]] = [arr[next], arr[i]];
      return arr;
    });

  const reorderFields = (arr: Field[]) => setFields(arr);

  /* -------------------------------------------------------------
   * SAVE TEMPLATE
   * ------------------------------------------------------------- */
  const onSave = async () => {
    const fd = new FormData();
    fd.append("id", initial.id);
    fd.append("name", name);
    fd.append("is_active", String(active));
    fd.append("fields", JSON.stringify(fields));

    await onSaveServer(fd);
    alert("Şablon kaydedildi.");
  };

  /* -------------------------------------------------------------
   * CREATE VERSION
   * ------------------------------------------------------------- */
  const onCreateVersion = async () => {
    if (initial.id === "new") {
      alert("Önce şablonu kaydedin.");
      return;
    }

    const version = await onCreateVersionServer(initial.id, fields);

    setVersions((prev) => [
      {
        id: crypto.randomUUID(),
        version,
        template_id: initial.id,
        created_at: new Date().toISOString(),
        created_by: null,
        fields,
        schema: {}
      },
      ...prev
    ]);

    setActiveVersion(version); // ✅ yeni versiyon aktif
  };

  /* -------------------------------------------------------------
   * RESTORE VERSION
   * ------------------------------------------------------------- */
  const onRestore = async (version: string) => {
    const restored = await onRestoreServer(initial.id, version);

    setFields(
      restored.map((f) => ({
        ...f,
        __id: crypto.randomUUID()
      }))
    );

    setActiveVersion(version); // ✅ aktif versiyon güncellendi
  };

  /* -------------------------------------------------------------
   * DELETE VERSION
   * (confirm + kurallar VersionSidebar'da)
   * ------------------------------------------------------------- */
  const onDeleteVersion = async (version: string) => {
    if (onDeleteVersionServer) {
      await onDeleteVersionServer(initial.id, version);
    }

    setVersions((prev) => prev.filter((v) => v.version !== version));

    if (activeVersion === version) {
      setActiveVersion(null);
    }
  };

  /* -------------------------------------------------------------
   * MAIN RENDER
   * ------------------------------------------------------------- */
  return (
    <div className="w-full min-h-screen bg-background text-foreground relative">

      {/* MAIN EDITOR FRAME */}
      <EditorFrame
        name={name}
        setName={setName}
        active={active}
        setActive={setActive}
        fields={fields}
        updateField={updateField}
        removeField={removeField}
        duplicateField={duplicateField}
        moveField={moveField}
        reorderFields={reorderFields}
        isPremium={isPremium}
        onAddField={addField}
        onCreateVersion={onCreateVersion}
        onSave={onSave}
        openVersions={() => setSidebarOpen(true)}
      />

      {/* FLOATING DESKTOP QUICK ACTIONS */}
      <FloatingActions
        onOpenAddSheet={() => setAddSheetOpen(true)}
        onSave={onSave}
        onOpenVersions={() => setSidebarOpen(true)}
      />

      {/* MOBILE BOTTOM TOOLBAR */}
      <MobileBottomToolbar
        onAddField={() => setAddSheetOpen(true)}
        onOpenPreview={() => setPreviewOpen(true)}
        onSave={onSave}
      />

      {/* MOBILE PREVIEW PANEL */}
      <MobilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fields={fields}
        name={name}
      />

      {/* VERSION SIDEBAR */}
      <VersionSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        versions={versions}
        templateId={initial.id}
        activeVersion={activeVersion}
        onRestore={onRestore}
        onDelete={onDeleteVersion}
        isPremium={isPremium}
        role={member?.role ?? null}
      />
    </div>
  );
}
