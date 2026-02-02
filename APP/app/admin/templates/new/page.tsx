//APP\app\admin\templates\new\page.tsx
import TemplateEditorWrapper from "../[id]/edit/TemplateEditorWrapper";

export default function NewTemplatePage() {
  return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Yeni Şablon</h1>

        <p className="text-sm text-foreground/60">
          OCR’dan içe aktardığınız veya sıfırdan oluşturduğunuz şablonu tasarlayın.
        </p>

        {/* Sadece Wrapper çalışacak — başka hiçbir TemplateEditor çağrısı yok */}
        <div className="rounded-xl border border-border bg-card p-6">
          <TemplateEditorWrapper />
        </div>
      </div>
    
  );
}
