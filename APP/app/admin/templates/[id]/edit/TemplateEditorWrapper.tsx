// APP/app/admin/templates/[id]/edit/TemplateEditorWrapper.tsx

import { getAdminContext } from "@/lib/admin/context";
import TemplateEditor from "./TemplateEditor.client";
import {
  saveTemplateAction,
  createVersionAction,
  restoreVersionAction,
  deleteTemplateVersionAction,
  getTemplateWithVersions,
} from "./actions";

import type { Field } from "./TemplateEditor.types";

interface WrapperProps {
  params?: { id: string };
}

/* -------------------------------------------------------------
 * FIELDS NORMALIZE
 * ------------------------------------------------------------- */
function normalizeFields(raw: any[]): Field[] {
  return raw.map((f) => {
    const base = { ...f, __id: f.__id ?? crypto.randomUUID() };

    if (f.type === "select") {
      let opts = f.options ?? [];
      if (Array.isArray(opts) && typeof opts[0] === "string") {
        opts = opts.map((o) => ({ label: o, value: o }));
      }
      return { ...base, options: opts };
    }

    return base;
  });
}

/* -------------------------------------------------------------
 * WRAPPER (SERVER)
 * ------------------------------------------------------------- */
export default async function TemplateEditorWrapper({ params }: WrapperProps) {
  const { member, org } = await getAdminContext();

  /** ✅ TEK DOĞRU PREMIUM KONTROL (ORGANIZATION) */
  const isPremium = org?.is_premium === true;
  const id = params?.id ?? "new";

  console.log("====== TEMPLATE EDITOR WRAPPER ======");
  console.log("TEMPLATE ID:", id);
  console.log("ORG:", org);
  console.log("IS PREMIUM:", isPremium);
  console.log("====================================");

  let initial: {
    id: string;
    name: string;
    is_active: boolean;
    fields: Field[];
  };

  let initialVersions: any[] = [];

  /* -------------------------------------------------------------
   * NEW TEMPLATE
   * ------------------------------------------------------------- */
  if (id === "new") {
    initial = {
      id: "new",
      name: "",
      is_active: true,
      fields: [],
    };
  }

  /* -------------------------------------------------------------
   * EXISTING TEMPLATE
   * ------------------------------------------------------------- */
  else {
    const { template, versions } = await getTemplateWithVersions(id);

    const parsedFields: Field[] = Array.isArray(template.fields)
      ? template.fields
      : template.fields
      ? JSON.parse(template.fields)
      : [];

    initial = {
      id: template.id,
      name: template.name,
      is_active: template.is_active,
      fields: normalizeFields(parsedFields),
    };

    /**
     * 🔒 KRİTİK GÜVENLİK
     * Free organizasyona SERVER tarafında bile version verilmez
     */
    initialVersions = isPremium
      ? versions.map((v) => ({
          ...v,
          fields: normalizeFields(v.fields ?? []),
        }))
      : [];

    console.log(
      "VERSIONS SENT:",
      initialVersions.length,
      isPremium ? "(PREMIUM)" : "(FREE - BLOCKED)"
    );
  }

  /* -------------------------------------------------------------
   * RENDER CLIENT
   * ------------------------------------------------------------- */
  return (
    <TemplateEditor
      initial={initial}
      initialVersions={initialVersions}
      member={member}
      isPremium={isPremium}

      /* SAVE TEMPLATE */
      onSaveServer={async (fd) => {
        "use server";
        await saveTemplateAction(fd);
      }}

      /* CREATE VERSION */
      onCreateVersionServer={async (templateId, fields) => {
        "use server";
        if (!isPremium) throw new Error("Premium required");

        const fd = new FormData();
        fd.append("templateId", templateId);
        fd.append("fields", JSON.stringify(fields));
        return createVersionAction(fd);
      }}

      /* RESTORE VERSION */
      onRestoreServer={async (templateId, version) => {
        "use server";
        if (!isPremium) throw new Error("Premium required");

        const fd = new FormData();
        fd.append("templateId", templateId);
        fd.append("version", version);
        return restoreVersionAction(fd);
      }}

      /* DELETE VERSION */
      onDeleteVersionServer={async (templateId, version) => {
        "use server";
        if (!isPremium) throw new Error("Premium required");

        const fd = new FormData();
        fd.append("templateId", templateId);
        fd.append("version", version);
        await deleteTemplateVersionAction(fd);
      }}
    />
  );
}
