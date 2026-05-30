import Link from "next/link";
import { ArrowLeft, Construction, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Créer une annonce de colocation · KAZA",
  description:
    "Publiez une annonce de colocation étudiante sur KAZA. Trouvez vos futurs colocataires en quelques minutes.",
};

export default function NewColocationPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col justify-center px-4 py-16 lg:px-8">
      <Card className="border-dashed">
        <CardHeader className="items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10 text-kaza-blue">
            <Construction className="size-7" />
          </div>
          <CardTitle className="font-heading text-2xl text-kaza-navy">
            Page en construction
          </CardTitle>
          <CardDescription className="mt-2 max-w-md text-base">
            Le formulaire de création d&apos;annonce de colocation arrive très
            bientôt. Notre équipe finalise cette expérience pour vous offrir le
            meilleur outil de mise en relation entre colocataires.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-10">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/student-living">
                <ArrowLeft className="mr-2 size-4" />
                Retour aux colocations
              </Link>
            </Button>
            <Button asChild className="bg-kaza-blue hover:bg-kaza-blue/90">
              <Link href="/student/roommate-matching">
                <Users className="mr-2 size-4" />
                Chercher un colocataire
              </Link>
            </Button>
          </div>
          <p className="mt-4 max-w-md text-center text-xs text-muted-foreground">
            En attendant, vous pouvez déjà parcourir les annonces existantes
            ou compléter votre profil colocataire pour être visible auprès
            d&apos;autres étudiants.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
