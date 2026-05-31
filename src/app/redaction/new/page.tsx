import type { Metadata } from "next";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listWriters } from "@/lib/queries/contributors";
import { ArticleEditorForm } from "@/components/cms/article-editor-form";

export const metadata: Metadata = { title: "Nouvel article — Rédaction KAZA" };
export const dynamic = "force-dynamic";

export default async function NewRedactionArticlePage() {
  const user = await getCurrentDisplayUser();
  const isAdmin = user?.role === "ADMIN";
  const writers = isAdmin ? await listWriters() : [];

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-kaza-navy">
        Nouvel article
      </h1>
      <ArticleEditorForm
        basePath="/redaction"
        writers={writers}
        canChooseAuthor={isAdmin}
      />
    </div>
  );
}
