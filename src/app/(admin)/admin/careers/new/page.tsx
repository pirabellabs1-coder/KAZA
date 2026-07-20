// =============================================================================
// Kaabo — Admin / Nouvelle offre d'emploi
// =============================================================================

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CareerOfferForm } from "../career-offer-form";

export default function NewCareerOfferPage() {
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
          Nouvelle offre d&apos;emploi
        </h1>
        <p className="text-sm text-muted-foreground">
          Renseignez les informations de l&apos;offre. Elle sera enregistrée en
          brouillon et publiée d&apos;un seul clic depuis la liste.
        </p>
      </div>

      <CareerOfferForm mode="create" />
    </div>
  );
}
