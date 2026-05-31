import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Plus, Users, PenLine } from "lucide-react";

import { listEditableArticles } from "@/lib/queries/articles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Articles — Admin KAZA" };
export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminArticlesPage() {
  const articles = await listEditableArticles();
  const published = articles.filter((a) => a.status === "PUBLISHED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-kaza-navy">
            <Newspaper className="size-6 text-kaza-blue" />
            Articles & blog
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {articles.length} article{articles.length > 1 ? "s" : ""} ·{" "}
            {published} publié{published > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/articles/contributeurs">
              <Users className="mr-1.5 size-4" /> Contributeurs
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-kaza-blue hover:bg-kaza-blue/90">
            <Link href="/admin/articles/new">
              <Plus className="mr-1.5 size-4" /> Nouvel article
            </Link>
          </Button>
        </div>
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
              <PenLine className="size-6 text-kaza-blue" />
            </div>
            <p className="mt-3 text-sm font-semibold text-kaza-navy">
              Aucun article pour le moment
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Rédigez votre premier article — il apparaîtra sur le blog public
              une fois publié.
            </p>
            <Button asChild size="sm" className="mt-4 bg-kaza-blue hover:bg-kaza-blue/90">
              <Link href="/admin/articles/new">
                <Plus className="mr-1.5 size-4" /> Rédiger un article
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Titre</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Auteur</th>
                    <th className="px-4 py-3">Catégorie</th>
                    <th className="px-4 py-3 text-right">Modifié</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {articles.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/articles/${a.id}`}
                          className="font-medium text-kaza-navy hover:text-kaza-blue"
                        >
                          {a.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {a.status === "PUBLISHED" ? (
                          <Badge className="border-0 bg-kaza-green/10 text-kaza-green">
                            Publié
                          </Badge>
                        ) : (
                          <Badge className="border-0 bg-amber-100 text-amber-700">
                            Brouillon
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.authorName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.category ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {formatDate(a.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
