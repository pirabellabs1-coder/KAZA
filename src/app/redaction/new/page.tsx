import type { Metadata } from "next";

import { ArticleEditorForm } from "@/components/cms/article-editor-form";

export const metadata: Metadata = { title: "Nouvel article — Rédaction KAZA" };

export default function NewRedactionArticlePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-kaza-navy">
        Nouvel article
      </h1>
      <ArticleEditorForm basePath="/redaction" />
    </div>
  );
}
