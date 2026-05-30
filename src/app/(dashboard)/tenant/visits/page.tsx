import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  CalendarX2,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { cancelVisitRequest } from "@/actions/visit-requests";
import {
  listTenantVisits,
  type TenantVisitItem,
  type TenantVisitStatus,
} from "@/lib/queries/tenant-activity";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mes demandes de visite",
};

const STATUS_META: Record<
  TenantVisitStatus,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING: {
    label: "En attente",
    className: "border-amber-500 bg-amber-500/10 text-amber-700",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmée",
    className: "bg-kaza-green text-white",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejetée",
    className: "bg-destructive text-destructive-foreground",
    icon: XCircle,
  },
  COMPLETED: {
    label: "Effectuée",
    className: "bg-muted text-muted-foreground",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Annulée",
    className: "border-gray-300 bg-gray-100 text-gray-600",
    icon: CalendarX2,
  },
};

function formatVisitDateFR(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatVisitTimeFR(time: string | null): string {
  if (!time) return "—";
  // time format from Postgres : "HH:MM:SS"
  const [h, m] = time.split(":");
  return `${h}h${m}`;
}

function isPast(visit: TenantVisitItem): boolean {
  if (["COMPLETED", "CANCELLED", "REJECTED"].includes(visit.status)) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(visit.requestedDate) < today;
}

export default async function TenantVisitsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/tenant/visits");

  const visits = await listTenantVisits(user.id);
  const pending = visits.filter((v) => v.status === "PENDING");
  const confirmed = visits.filter((v) => v.status === "CONFIRMED");
  const past = visits.filter(isPast);

  return (
    <div className="space-y-6">
      {/* Header luxe */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
            Mes demandes de visite
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivez l&apos;état de vos visites planifiées et organisez vos
            prochains rendez-vous.
          </p>
        </div>

        <Button
          asChild
          className="bg-kaza-blue hover:bg-kaza-blue/90 sm:self-end"
        >
          <Link href="/properties">
            <Plus className="mr-1.5 size-4" />
            Nouvelle demande
          </Link>
        </Button>
      </div>

      {visits.length === 0 ? (
        <EmptyStateVisits />
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="flex w-full flex-wrap gap-1 sm:w-fit">
            <TabKey value="all" label="Toutes" count={visits.length} />
            <TabKey value="pending" label="En attente" count={pending.length} />
            <TabKey
              value="confirmed"
              label="Confirmées"
              count={confirmed.length}
            />
            <TabKey value="past" label="Passées" count={past.length} />
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <VisitGrid visits={visits} />
          </TabsContent>
          <TabsContent value="pending" className="mt-6">
            <VisitGrid visits={pending} />
          </TabsContent>
          <TabsContent value="confirmed" className="mt-6">
            <VisitGrid visits={confirmed} />
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            <VisitGrid visits={past} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function TabKey({
  value,
  label,
  count,
}: {
  value: string;
  label: string;
  count: number;
}) {
  return (
    <TabsTrigger value={value}>
      {label}
      <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
        {count}
      </span>
    </TabsTrigger>
  );
}

function VisitGrid({ visits }: { visits: TenantVisitItem[] }) {
  if (visits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/40 py-12 text-center text-sm text-muted-foreground">
        Aucune visite dans cette catégorie.
      </div>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {visits.map((v) => (
        <VisitCard key={v.id} visit={v} />
      ))}
    </div>
  );
}

function VisitCard({ visit }: { visit: TenantVisitItem }) {
  const meta = STATUS_META[visit.status];
  const Icon = meta.icon;
  const canCancel = visit.status === "PENDING" || visit.status === "CONFIRMED";

  return (
    <Card className="overflow-hidden rounded-2xl transition-shadow hover:shadow-lg">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Photo */}
          <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-44">
            <Image
              src={visit.property.primaryPhotoUrl}
              alt={visit.property.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 176px"
            />
            <div className="absolute left-3 top-3">
              <Badge className={cn("gap-1", meta.className)}>
                <Icon className="size-3" />
                {meta.label}
              </Badge>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
            <div>
              <h3 className="font-heading line-clamp-1 text-base font-semibold text-foreground sm:text-lg">
                {visit.property.title}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="line-clamp-1">{visit.property.address}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t pt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="size-4 text-kaza-blue" />
                <span className="font-medium text-foreground">
                  {formatVisitDateFR(visit.requestedDate)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-4 text-kaza-blue" />
                <span className="font-medium text-foreground">
                  {formatVisitTimeFR(visit.requestedTime)}
                </span>
              </div>
            </div>

            {visit.message && (
              <p className="rounded-md bg-muted/50 px-3 py-2 text-xs italic text-muted-foreground">
                « {visit.message} »
              </p>
            )}

            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" asChild className="text-xs">
                <Link href={`/properties/${visit.property.id}`}>
                  Voir le bien
                </Link>
              </Button>
              {canCancel && (
                <form action={cancelVisitRequest.bind(null, visit.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Annuler
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyStateVisits() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-gradient-to-br from-white via-kaza-blue/5 to-kaza-navy/5 py-16 text-center sm:py-24">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
        <CalendarDays className="size-12 text-gray-300" strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-xl font-semibold text-kaza-navy sm:text-2xl">
        Aucune demande de visite
      </h2>
      <p className="mx-auto mt-3 max-w-md px-6 text-sm text-muted-foreground">
        Trouvez votre futur logement et demandez une visite en un clic depuis la
        page d&apos;une annonce.
      </p>
      <div className="mt-8">
        <Button
          asChild
          size="lg"
          className="bg-kaza-blue hover:bg-kaza-blue/90"
        >
          <Link href="/properties">
            <Plus className="mr-2 size-4" />
            Parcourir les annonces
          </Link>
        </Button>
      </div>
    </div>
  );
}
