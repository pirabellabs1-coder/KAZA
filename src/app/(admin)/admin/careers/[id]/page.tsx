// =============================================================================
// Kaabo — Admin / Édition d'une offre d'emploi
// =============================================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getJobOfferById } from "@/lib/queries/careers";
import { Button } from "@/components/ui/button";
import { CareerOfferForm } from "../career-offer-form";

export default async function EditCareerOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offer = await getJobOfferById(id);
  if (!offer) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 text-muted-foreground hover:text-kaza-navy"
        >
          <Link href="/admin/careers">
            <ArrowLeft className="mr-1 size-4" />
            Retour à la liste
          </Link>
        </Button>
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Modifier l&apos;offre
        </h1>
        <p className="text-sm text-muted-foreground">
          {offer.title} · {offer.status}
        </p>
      </div>

      <CareerOfferForm
        mode="edit"
        offerId={offer.id}
        initial={{
          title: offer.title,
          slug: offer.slug,
          department: offer.department,
          location: offer.location,
          contract: offer.contract,
          level: offer.level ?? "",
          summary: offer.summary,
          description: offer.description,
          requirements: offer.requirements ?? "",
          benefits: offer.benefits ?? "",
          salary_range: offer.salaryRange ?? "",
          apply_email: offer.applyEmail,
        }}
      />
    </div>
  );
}
