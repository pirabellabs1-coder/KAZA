import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  MapPin,
  Search,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  listStudentColocations,
  type StudentColocationItem,
} from "@/lib/queries/tenant-activity";
import { listColocationCandidates } from "@/lib/queries/colocation-members";
import { formatPrice, formatDate } from "@/lib/utils";

import { ColocationCandidatesPanel } from "./candidates-panel";

export const metadata: Metadata = {
  title: "Mes Colocations",
};

function statusBadge(status: StudentColocationItem["status"]) {
  switch (status) {
    case "ACTIVE":
      return { label: "Ouverte", className: "bg-kaza-green text-white" };
    case "FULL":
      return {
        label: "Complète",
        className: "bg-kaza-blue text-white",
      };
    case "CLOSED":
      return {
        label: "Fermée",
        className: "border-gray-300 bg-gray-100 text-gray-600",
      };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
}

export default async function StudentColocationsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/student/colocations");

  const [colocations, candidates] = await Promise.all([
    listStudentColocations(user.id),
    listColocationCandidates(user.id),
  ]);

  return (
    <div className="space-y-6">
      <ColocationCandidatesPanel candidates={candidates} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
            Mes colocations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {colocations.length === 0
              ? "Trouvez vos futurs colocataires sur Kaabo"
              : `${colocations.length} coloc${colocations.length > 1 ? "s" : ""} active${colocations.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Button asChild className="bg-kaza-blue hover:bg-kaza-blue/90">
          <Link href="/student-living/new">
            <UserPlus className="mr-2 size-4" />
            Créer une annonce
          </Link>
        </Button>
      </div>

      {colocations.length === 0 ? (
        <EmptyStateColoc />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colocations.map((coloc) => (
            <ColocCard key={coloc.id} coloc={coloc} />
          ))}
        </div>
      )}
    </div>
  );
}

function ColocCard({ coloc }: { coloc: StudentColocationItem }) {
  const badge = statusBadge(coloc.status);

  return (
    <Card className="group flex flex-col overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
      <CardContent className="flex flex-1 flex-col p-0">
        {/* Photo */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={coloc.primaryPhotoUrl}
            alt={coloc.title}
            fill
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <Badge className={badge.className}>{badge.label}</Badge>
            {coloc.isOwner && (
              <Badge className="border-0 bg-kaza-navy/90 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
                Mon annonce
              </Badge>
            )}
          </div>
          <div className="absolute bottom-3 left-3 rounded-2xl bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-md">
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-base font-bold text-kaza-navy">
                {formatPrice(coloc.monthlyShare)}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                /pers./mois
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <Link href={`/student-living/${coloc.id}`}>
            <h3 className="font-heading line-clamp-2 text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-kaza-blue sm:text-lg">
              {coloc.title}
            </h3>
          </Link>

          {coloc.address && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 text-kaza-blue" />
              <span className="line-clamp-1">{coloc.address}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5 text-kaza-blue" />
              <span>
                <span className="font-semibold text-kaza-navy">
                  {coloc.spotsLeft}
                </span>{" "}
                place{coloc.spotsLeft > 1 ? "s" : ""} restante
                {coloc.spotsLeft > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CreditCard className="size-3.5 text-kaza-blue" />
              <span>{coloc.membersCount} membre{coloc.membersCount > 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CalendarDays className="size-3" />
            Créée le {formatDate(coloc.createdAt)}
          </div>

          <div className="mt-auto flex gap-2 pt-2">
            <Button
              asChild
              size="sm"
              className="flex-1 bg-kaza-blue hover:bg-kaza-blue/90"
            >
              <Link href={`/student-living/${coloc.id}`}>Voir détails</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyStateColoc() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-gradient-to-br from-white via-kaza-blue/5 to-kaza-navy/5 py-16 text-center sm:py-24">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
        <Users className="size-12 text-gray-300" strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-xl font-semibold text-kaza-navy sm:text-2xl">
        Aucune colocation pour le moment
      </h2>
      <p className="mx-auto mt-3 max-w-md px-6 text-sm text-muted-foreground">
        Trouvez vos futurs colocataires sur Kaabo et partagez plus
        qu&apos;un logement.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button
          asChild
          size="lg"
          className="bg-kaza-blue hover:bg-kaza-blue/90"
        >
          <Link href="/student-living">
            <Search className="mr-2 size-4" />
            Rechercher une coloc
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/student-living/new">
            <UserPlus className="mr-2 size-4" />
            Créer mon annonce
          </Link>
        </Button>
      </div>
    </div>
  );
}
