//APP\app\admin\templates\[id]\edit\EditorFrame.tsx
"use client";

import type { Field } from "./TemplateEditor.types";

interface EditorFrameProps {
  name: string;
  setName: (v: string) => void;

  active: boolean;
  setActive: (v: boolean) => void;

  fields: Field[];
  updateField: (i: number, patch: Partial<Field>) => void;
  removeField: (i: number) => void;
  duplicateField: (i: number) => void;
  moveField: (i: number, dir: -1 | 1) => void;
  reorderFields: (arr: Field[]) => void;
  isPremium: boolean;
  onAddField: (type: Field["type"]) => void;

  onSave: () => void;
  onCreateVersion: () => void;

  openVersions: () => void;
}

function normalizeOptions(opt: any): string[] {
  if (!opt) return [];
  if (Array.isArray(opt)) {
    return opt.map((x) => (typeof x === "string" ? x : x.value ?? ""));
  }
  return [];
}

export default function EditorFrame({
  name,
  setName,
  active,
  setActive,
  fields,
  updateField,
  removeField,
  duplicateField,
  moveField,
  reorderFields,
  isPremium,
  onAddField,
  onSave,
  onCreateVersion,
  openVersions
}: EditorFrameProps) {
  return (
    <div className="w-full h-full flex flex-col bg-[#f5f5f7] text-[#1d1d1f]">

      {/* -------------------------------------------------------------
       * macOS STYLE TOP TOOLBAR
       * ------------------------------------------------------------- */}
      <div
        className="
          sticky top-0 z-40
          backdrop-blur-xl bg-white/70
          border-b border-black/5
          px-5 py-3
          flex flex-col md:flex-row md:items-center md:justify-between
          gap-3
        "
      >
        {/* LEFT */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Şablon adı"
            className="
              px-3 py-2 w-full md:w-64
              rounded-xl
              bg-white
              border border-black/10
              shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500/40
            "
          />

          <label className="flex items-center gap-2 text-sm text-black/70 select-none">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="accent-blue-600"
            />
            Aktif
          </label>
        </div>

        {/* RIGHT */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openVersions}
            className="
              px-4 py-2
              rounded-full
              bg-white
              border border-black/10
              shadow-sm
              text-sm
              hover:bg-black/5
            "
          >
            Versiyonlar
          </button>
          
          <button
            disabled={!isPremium}
            onClick={isPremium ? onCreateVersion : openVersions}
            className={`
              px-4 py-2 rounded-full text-sm shadow-sm
              ${isPremium
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"}
            `}
          >
            Yeni Versiyon
          </button>


          <button
            onClick={onSave}
            className="
              px-5 py-2
              rounded-full
              bg-green-600 text-white
              text-sm font-medium
              shadow-sm
              hover:bg-green-700
            "
          >
            Kaydet
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
       * CONTENT
       * ------------------------------------------------------------- */}
      <div className="flex-1 p-6 space-y-6">

        {/* ADD FIELD BAR */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            ["divider", "Bölüm"],
            ["boolean", "Onay"],
            ["text", "Metin"],
            ["textarea", "Uzun Metin"],
            ["select", "Seçim"]
          ].map(([type, label]) => (
            <button
              key={type}
              onClick={() => onAddField(type as any)}
              className="
                px-4 py-2
                rounded-full
                bg-white
                border border-black/10
                shadow-sm
                text-sm
                whitespace-nowrap
                hover:bg-black/5
              "
            >
              + {label}
            </button>
          ))}
        </div>

        {/* FIELD LIST */}
        <div className="space-y-4">
          {fields.map((f, i) => {
            const options = normalizeOptions((f as any).options);

            return (
              <div
                key={f.__id}
                className="
                  bg-white
                  rounded-2xl
                  border border-black/10
                  shadow-sm
                  p-4
                "
              >
                {/* HEADER */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold tracking-wide text-black/50">
                  {{
                    divider: "DENETİM BAŞLIĞI",
                    boolean: "KONTROL MADDESİ",
                    text: "KISA AÇIKLAMA",
                    textarea: "DETAYLI AÇIKLAMA",
                    select: "DURUM SEÇİMİ"
                  }[f.type]}
                </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button onClick={() => moveField(i, -1)} className="hover:opacity-60">↑</button>
                    <button onClick={() => moveField(i, 1)} className="hover:opacity-60">↓</button>
                    <button onClick={() => duplicateField(i)} className="hover:opacity-60">Kopyala</button>
                    <button onClick={() => removeField(i)} className="text-red-500 hover:text-red-700">Sil</button>
                  </div>
                </div>

                {/* BODY */}
                <div className="space-y-3">

                  {/* DIVIDER */}
                  {f.type === "divider" && (
                    <input
                      value={f.label ?? ""}
                      onChange={(e) => updateField(i, { label: e.target.value })}
                      placeholder="Bölüm başlığı"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-blue-500/30"
                    />
                  )}

                  {/* BOOLEAN */}
                  {f.type === "boolean" && (
                    <>
                      <input
                        value={f.label ?? ""}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                        placeholder="Madde adı"
                        className="w-full px-3 py-2 rounded-xl border border-black/10"
                      />

                      <label className="flex items-center gap-2 text-xs text-black/60">
                        <input
                          type="checkbox"
                          checked={f.critical ?? false}
                          onChange={(e) => updateField(i, { critical: e.target.checked })}
                          className="accent-red-600"
                        />
                        Kritik madde
                      </label>
                    </>
                  )}

                  {/* TEXT / TEXTAREA */}
                  {(f.type === "text" || f.type === "textarea") && (
                    <>
                      <input
                        value={f.label ?? ""}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                        placeholder="Alan etiketi"
                        className="w-full px-3 py-2 rounded-xl border border-black/10"
                      />
                      <input
                        value={(f as any).placeholder ?? ""}
                        onChange={(e) => updateField(i, { placeholder: e.target.value })}
                        placeholder="Placeholder"
                        className="w-full px-3 py-2 rounded-xl border border-black/10"
                      />
                    </>
                  )}

                  {/* SELECT */}
                  {f.type === "select" && (
                    <>
                      <input
                        value={f.label ?? ""}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                        placeholder="Seçim alanı etiketi"
                        className="w-full px-3 py-2 rounded-xl border border-black/10"
                      />

                      <div className="space-y-2">
                        <div className="text-xs text-black/50">Seçenekler</div>

                        {options.map((opt, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              value={opt}
                              onChange={(e) => {
                                const list = [...options];
                                list[idx] = e.target.value;
                                updateField(i, { options: list });
                              }}
                              className="flex-1 px-3 py-2 rounded-xl border border-black/10"
                            />
                            <button
                              onClick={() => {
                                const list = [...options];
                                list.splice(idx, 1);
                                updateField(i, { options: list });
                              }}
                              className="text-red-500 text-xs"
                            >
                              Sil
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={() => updateField(i, { options: [...options, ""] })}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          + Seçenek Ekle
                        </button>
                      </div>
                    </>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
