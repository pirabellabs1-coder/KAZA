import type { Metadata } from "next";
import Link from "next/link";
import { PenLine, Plus } from "lucide-react";

import { listEditableArticles } from "@/lib/queries/articles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Rédaction — KAZA" };
export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function RedactionPage() {
  const articles = await listEditableArticles();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-kaza-navy">
            <PenLine className="size-6 text-kaza-blue" />
            Mes articles
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rédigez et publiez des articles pour le journal KAZA.
          </p>
        </div>
        <Button asChild size="sm" className="bg-kaza-blue hover:bg-kaza-blue/90">
          <Link href="/redaction/new">
            <Plus className="mr-1.5 size-4" /> Nouvel article
          </Link>
        </Button>
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
              <PenLine className="size-6 text-kaza-blue" />
            </div>
            <p className="mt-3 text-sm font-semibold text-kaza-navy">
              Vous n&apos;avez pas encore d&apos;article
            </p>
            <Button asChild size="sm" className="mt-4 bg-kaza-blue hover:bg-kaza-blue/90">
              <Link href="/redaction/new">
                <Plus className="mr-1.5 size-4" /> Rédiger mon premier article
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/redaction/${a.id}`}
              className="block rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-kaza-navy">{a.title}</p>
                {a.status === "PUBLISHED" ? (
                  <Badge className="border-0 bg-kaza-green/10 text-kaza-green">
                    Publié
                  </Badge>
                ) : (
                  <Badge className="border-0 bg-amber-100 text-amber-700">
                    Brouillon
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {a.category ?? "Sans catégorie"} · modifié le{" "}
                {formatDate(a.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
