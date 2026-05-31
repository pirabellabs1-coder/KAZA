// =============================================================================
// KAZA — Admin / Abonnés newsletter
// Server component. Lit `newsletter_subscribers` (inscriptions footer, landing,
// faq…) via `listNewsletterSubscribers`. Export CSV délégué à un composant
// client. RLS : SELECT réservé aux ADMIN.
// =============================================================================

import type { Metadata } from "next";
import { Mail, Users, UserCheck, UserX } from "lucide-react";

import {
  listNewsletterSubscribers,
  computeNewsletterStats,
} from "@/lib/queries/newsletter-admin";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ExportSubscribersButton } from "./export-button";

export const metadata: Metadata = {
  title: "Abonnés newsletter — Admin KAZA",
};

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminNewsletterPage() {
  const subscribers = await listNewsletterSubscribers();
  const stats = computeNewsletterStats(subscribers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-kaza-navy">
            <Mail className="size-6 text-kaza-blue" />
            Abonnés newsletter
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inscriptions collectées sur le site (pied de page, accueil, FAQ…).
          </p>
        </div>
        <ExportSubscribersButton subscribers={subscribers} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kaza-navy">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total inscrits</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-kaza-green/10 text-kaza-green">
              <UserCheck className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kaza-navy">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <UserX className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-kaza-navy">
                {stats.unsubscribed}
              </p>
              <p className="text-xs text-muted-foreground">Désabonnés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par source */}
      {stats.bySource.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sources d&apos;inscription</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {stats.bySource.map((s) => (
              <Badge
                key={s.source}
                variant="outline"
                className="border-kaza-blue/20 text-kaza-navy"
              >
                {s.source} · {s.count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Liste des abonnés ({subscribers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 py-12 text-center">
              <Mail className="size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold text-kaza-navy">
                Aucun abonné pour le moment
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Les inscriptions à la newsletter via le site apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Inscrit le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-kaza-navy">
                        {s.email}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.source ?? "—"}
                      </TableCell>
                      <TableCell>
                        {s.unsubscribed ? (
                          <Badge className="border-0 bg-rose-100 text-rose-700">
                            Désabonné
                          </Badge>
                        ) : (
                          <Badge className="border-0 bg-kaza-green/10 text-kaza-green">
                            Actif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDate(s.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
