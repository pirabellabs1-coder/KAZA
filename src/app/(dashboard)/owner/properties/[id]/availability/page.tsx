import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getPropertyById } from "@/lib/queries/properties";
import { AvailabilityCalendar } from "./availability-calendar";

export const metadata: Metadata = {
  title: "Calendrier de disponibilité",
};

interface AvailabilityPageProps {
  params: Promise<{ id: string }>;
}

export default async function AvailabilityPage({
  params,
}: AvailabilityPageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/owner/properties/${property.id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="size-5 text-kaza-blue" />
              <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                Calendrier de disponibilité — {property.title}
              </h1>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Bloquez les dates où votre bien n&apos;est pas disponible
              (maintenance, usage personnel, etc.). Les locataires ne pourront
              pas demander de visite sur ces périodes.
            </p>
          </div>
        </div>
      </div>

      <AvailabilityCalendar propertyId={property.id} />
    </div>
  );
}
