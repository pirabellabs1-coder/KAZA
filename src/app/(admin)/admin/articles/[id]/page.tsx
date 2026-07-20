import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getArticleById } from "@/lib/queries/articles";
import { listWriters } from "@/lib/queries/contributors";
import { ArticleEditorForm } from "@/components/cms/article-editor-form";

export const metadata: Metadata = { title: "Éditer l'article — Admin Kaabo" };
export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, writers] = await Promise.all([
    getArticleById(id),
    listWriters(),
  ]);
  if (!article) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-kaza-navy">
        Éditer l&apos;article
      </h1>
      <ArticleEditorForm
        basePath="/admin/articles"
        writers={writers}
        canChooseAuthor
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
