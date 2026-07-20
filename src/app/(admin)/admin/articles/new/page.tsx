import type { Metadata } from "next";

import { listWriters } from "@/lib/queries/contributors";
import { ArticleEditorForm } from "@/components/cms/article-editor-form";

export const metadata: Metadata = { title: "Nouvel article — Admin Kaabo" };
export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const writers = await listWriters();
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-kaza-navy">
        Nouvel article
      </h1>
      <ArticleEditorForm
        basePath="/admin/articles"
        writers={writers}
        canChooseAuthor
      />
    </div>
  );
}
