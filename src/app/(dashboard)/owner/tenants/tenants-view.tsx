"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  MessageSquare,
  Search,
  Users,
  Wallet,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast-helper";
import { formatDate, getInitials } from "@/lib/utils";
import type { OwnerTenant } from "@/lib/queries/owner-activity";

function formatFcfa(value: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

interface OwnerTenantsViewProps {
  tenants: OwnerTenant[];
  /**
   * Base d'URL de la fiche locataire (ex: "/agency/tenants"). Si fournie, le
   * bouton « Voir profil » devient un lien vers `${detailHrefBase}/${id}`.
   * Absent (espace propriétaire) → comportement inchangé.
   */
  detailHrefBase?: string;
}

export function OwnerTenantsView({
  tenants,
  detailHrefBase,
}: OwnerTenantsViewProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter((t) =>
      `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase().includes(q),
    );
  }, [search, tenants]);

  const totals = useMemo(() => {
    const totalPaid = tenants.reduce((sum, t) => sum + t.totalPaidFcfa, 0);
    return { totalPaid, count: tenants.length };
  }, [tenants]);

  const handleMessage = (t: OwnerTenant) => {
    toast.success(
      `Message à ${t.firstName} ${t.lastName} — bientôt disponible.`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy">
            Mes locataires
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenants.length === 0
              ? "Vos locataires actifs apparaîtront ici."
              : `${totals.count} locataire${totals.count > 1 ? "s" : ""} actif${totals.count > 1 ? "s" : ""} · ${formatFcfa(totals.totalPaid)} encaissés au total`}
          </p>
        </div>
        {tenants.length > 0 && (
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un locataire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        )}
      </div>

      {tenants.length === 0 ? (
        <EmptyTenantsCard />
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun locataire ne correspond à « {search} ».
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TenantCard
              key={t.id}
              tenant={t}
              detailHrefBase={detailHrefBase}
              onMessage={() => handleMessage(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TenantCardProps {
  tenant: OwnerTenant;
  onMessage: () => void;
  detailHrefBase?: string;
}

function TenantCard({ tenant, onMessage, detailHrefBase }: TenantCardProps) {
  const initials =
    getInitials(tenant.firstName || tenant.email, tenant.lastName || " ") ||
    "?";
  const fullName =
    `${tenant.firstName} ${tenant.lastName}`.trim() || "Locataire";

  return (
    <Card className="group rounded-2xl border-0 shadow-sm transition hover:shadow-md">
      <CardContent className="space-y-4 p-5">
        {/* Identity */}
        <div className="flex items-start gap-3">
          <Avatar size="lg">
            <AvatarFallback className="bg-kaza-navy text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-kaza-navy">{fullName}</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">
                {tenant.email || "Email non renseigné"}
              </span>
            </p>
          </div>
          <Badge className="bg-kaza-green/15 text-kaza-green hover:bg-kaza-green/15">
            Actif
          </Badge>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
          <div>
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Building2 className="size-3" />
              Biens loués
            </p>
            <p className="mt-1 text-lg font-bold text-kaza-navy">
              {tenant.propertiesRented}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Wallet className="size-3" />
              Total payé
            </p>
            <p className="mt-1 text-lg font-bold text-kaza-navy">
              {formatFcfa(tenant.totalPaidFcfa)}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Locataire depuis{" "}
          <span className="font-medium text-foreground">
            {tenant.activeSince ? formatDate(tenant.activeSince) : "—"}
          </span>
        </p>

        {/* Actions */}
        <div className="flex gap-2 border-t pt-3">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/messages?to=${tenant.id}`}>
              <MessageSquare className="mr-1 size-3.5" />
              Message
            </Link>
          </Button>
          {detailHrefBase ? (
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`${detailHrefBase}/${tenant.id}`}>Voir profil</Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onMessage}
            >
              Voir profil
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyTenantsCard() {
  return (
    <Card className="rounded-2xl border-2 border-dashed bg-gradient-to-br from-white via-muted/20 to-kaza-blue/[0.04] shadow-sm">
      <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-kaza-blue/10">
          <Users className="size-8 text-kaza-blue" />
        </div>
        <h2 className="mt-6 font-heading text-xl font-bold text-kaza-navy">
          Aucun locataire pour le moment
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Vous verrez vos locataires apparaître ici dès qu’un bail sera signé.
          Commencez par publier ou activer une annonce.
        </p>
      </CardContent>
    </Card>
  );
}
