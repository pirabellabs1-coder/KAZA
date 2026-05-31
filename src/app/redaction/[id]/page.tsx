import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getArticleById } from "@/lib/queries/articles";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listWriters } from "@/lib/queries/contributors";
import { ArticleEditorForm } from "@/components/cms/article-editor-form";

export const metadata: Metadata = { title: "Éditer l'article — Rédaction KAZA" };
export const dynamic = "force-dynamic";

export default async function EditRedactionArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, user] = await Promise.all([
    getArticleById(id),
    getCurrentDisplayUser(),
  ]);
  if (!article) notFound();
  const isAdmin = user?.role === "ADMIN";
  const writers = isAdmin ? await listWriters() : [];

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-kaza-navy">
        Éditer l&apos;article
      </h1>
      <ArticleEditorForm
        basePath="/redaction"
        writers={writers}
        canChooseAuthor={isAdmin}
        article={{
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          coverImageUrl: article.coverImageUrl,
          category: article.category,
          status: article.status,
          slug: article.slug,
          authorId: article.authorId,
          authorName: article.authorName,
          authorRole: article.authorRole,
        }}
      />
    </div>
  );
}
