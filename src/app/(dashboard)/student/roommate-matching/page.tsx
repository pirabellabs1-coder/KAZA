import Link from "next/link";
import { Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchingFilters } from "./matching-filters";

// =============================================================================
// KAZA - Page Matching Colocataires (étudiants)
// =============================================================================

interface RoommateProfile {
  id: string;
  pseudo: string;
  age: number;
  gender: "female" | "male";
  discipline: string;
  school: string;
  city: string;
  budget: number;
  habits: string[];
  compatibility: number;
  bio: string;
}

// Tant que la query Supabase `listRoommateMatches` (filtrée par préférences
// + score de compatibilité) n'est pas branchée, on initialise la liste à
// vide. Aucun profil étudiant inventé n'est affiché.
const MATCHES: RoommateProfile[] = [];

export default function RoommateMatchingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-kaza-blue" />
          <span className="text-xs font-semibold uppercase tracking-wider text-kaza-blue">
            Colocation étudiante
          </span>
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Trouvez votre colocataire idéal
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Découvrez des étudiants compatibles avec votre style de vie, votre
            budget et votre quartier. Notre algorithme vous propose les
            meilleurs profils en fonction de vos critères.
          </p>
        </div>
      </div>

      {/* Layout sidebar + grid */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar filtres */}
        <MatchingFilters />

        {/* Grille profils — empty state */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {MATCHES.length} colocataire{MATCHES.length > 1 ? "s" : ""}
              </span>{" "}
              correspondent à vos critères
            </p>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10">
                <Sparkles className="size-7 text-kaza-blue" />
              </div>
              <p className="mt-4 font-heading text-base font-semibold text-kaza-navy">
                Aucun profil compatible pour le moment
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Affinez vos critères dans la barre de gauche ou complétez votre
                propre profil pour améliorer la qualité du matching. Les
                nouveaux colocataires s&apos;inscrivent chaque semaine.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/student/profile-coloc">
                  Compléter mon profil
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
