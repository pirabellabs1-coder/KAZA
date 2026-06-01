import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  CreditCard,
  FileSignature,
  Home,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listTenantRentals } from "@/lib/queries/tenant-activity";
import { getContractsForRentals } from "@/lib/rentals/lifecycle";
import { formatPrice, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Détail de ma location — KAZA" };

export const dynamic = "force-dynamic";

export default async function TenantRentalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentDisplayUser();
  if (!user) redirect(`/login?redirect=/tenant/rentals/${id}`);

  const rentals = await listTenantRentals(user.id);
  const rental = rentals.find((r) => r.id === id);
  if (!rental) notFound();

  const contracts = await getContractsForRentals([rental.id]);
  const contract = contracts.get(rental.id) ?? null;
  const signed = contract?.signed ?? false;
  const isActive = rental.status === "ACTIVE";
  const isPending = rental.status === "PENDING";

  // Étapes du parcours.
  const steps = [
    { label: "Candidature acceptée", done: true },
    { label: "Bail signé", done: signed || isActive },
    { label: "1er loyer payé · location active", done: isActive },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href="/tenant/rentals">
          <ArrowLeft className="size-4" /> Mes locations
        </Link>
      </Button>

      {/* En-tête bien */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-44 w-full shrink-0 sm:h-auto sm:w-56">
            <Image
              src={rental.property.primaryPhotoUrl}
              alt={rental.property.title}
              fill
              className="object-cover"
              sizes="(max-width:640px) 100vw, 224px"
            />
          </div>
          <div className="flex-1 p-5">
            <h1 className="font-heading text-xl font-bold text-kaza-navy">
              {rental.property.title}
            </h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {rental.property.address}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <CreditCard className="size-4 text-muted-foreground" />
                <strong>{formatPrice(rental.monthlyRent)}</strong>/mois
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4 text-muted-foreground" />
                {formatDate(rental.startDate)}
                {rental.endDate ? ` → ${formatDate(rental.endDate)}` : ""}
              </span>
            </div>
            <Badge
              className={cn(
                "mt-3",
                isActive
                  ? "bg-kaza-green text-white"
                  : isPending
                    ? "border-amber-500 bg-amber-500/10 text-amber-700"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {isActive
                ? "Location active"
                : isPending
                  ? "En cours de finalisation"
                  : rental.status}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Timeline du parcours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suivi de votre location</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={s.label} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    s.done
                      ? "bg-kaza-green text-white"
                      : "border-2 border-border bg-white text-muted-foreground",
                  )}
                >
                  {s.done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    s.done ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </li>
            ))}
          </ol>

          {/* Action contextuelle */}
          <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
            {isPending && !signed && (
              <Button asChild className="gap-1.5">
                <Link href={`/contracts/${rental.id}`}>
                  <FileSignature className="size-4" /> Signer le bail
                </Link>
              </Button>
            )}
            {isPending && signed && (
              <Button asChild className="gap-1.5">
                <Link href={`/tenant/payments/checkout?rentalId=${rental.id}`}>
                  <CreditCard className="size-4" /> Payer le 1er loyer
                </Link>
              </Button>
            )}
            {isActive && (
              <Button asChild className="gap-1.5">
                <Link href={`/tenant/payments/checkout?rentalId=${rental.id}`}>
                  <CreditCard className="size-4" /> Payer le loyer
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="gap-1.5">
              <Link href={`/contracts/${rental.id}`}>
                <Home className="size-4" /> Voir le bail
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
