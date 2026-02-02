// APP/app/admin/templates/[id]/edit/page.tsx

export const dynamic = "force-dynamic";
export const revalidate = 0;

import TemplateEditorWrapper from "./TemplateEditorWrapper";

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  return (
      <TemplateEditorWrapper params={params} />
  );
}
