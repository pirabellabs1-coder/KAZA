"use client";

import {
  GraduationCap,
  MapPin,
  Sparkles,
  Wallet,
  MessageCircle,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchingFilters } from "./matching-filters";
import { formatPrice } from "@/lib/utils";

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

const MOCK_PROFILES: RoommateProfile[] = [
  {
    id: "rm-001",
    pseudo: "Awa K.",
    age: 21,
    gender: "female",
    discipline: "Médecine",
    school: "UAC - FSS",
    city: "Abomey-Calavi",
    budget: 80000,
    habits: ["Non-fumeuse", "Calme", "Ordonnée"],
    compatibility: 94,
    bio: "Étudiante en 3e année de médecine, je cherche une coloc studieuse et bienveillante.",
  },
  {
    id: "rm-002",
    pseudo: "Kofi M.",
    age: 23,
    gender: "male",
    discipline: "Informatique",
    school: "IFRI",
    city: "Cotonou",
    budget: 100000,
    habits: ["Lève-tôt", "Sociable", "Aime cuisiner"],
    compatibility: 89,
    bio: "Dev en alternance, j'adore partager de bons repas et discuter tech.",
  },
  {
    id: "rm-003",
    pseudo: "Fatou S.",
    age: 20,
    gender: "female",
    discipline: "Droit",
    school: "UAC - FADESP",
    city: "Cotonou",
    budget: 70000,
    habits: ["Calme", "Non-fumeuse", "Ordonnée"],
    compatibility: 87,
    bio: "Étudiante en L2 droit, sérieuse mais sympa, je cherche un environnement paisible.",
  },
  {
    id: "rm-004",
    pseudo: "Yannick D.",
    age: 22,
    gender: "male",
    discipline: "Économie / Gestion",
    school: "FASEG",
    city: "Abomey-Calavi",
    budget: 90000,
    habits: ["Sociable", "Sportif", "Couche-tard"],
    compatibility: 82,
    bio: "Master 1 finance, passionné de basket et de musique, ouvert et facile à vivre.",
  },
  {
    id: "rm-005",
    pseudo: "Aminata B.",
    age: 24,
    gender: "female",
    discipline: "Architecture",
    school: "EPAC",
    city: "Cotonou",
    budget: 110000,
    habits: ["Créative", "Calme", "Aime cuisiner"],
    compatibility: 78,
    bio: "Architecte en formation, j'aime les espaces lumineux et les soirées tranquilles.",
  },
  {
    id: "rm-006",
    pseudo: "Ibrahim T.",
    age: 25,
    gender: "male",
    discipline: "Ingénierie",
    school: "EPAC",
    city: "Abomey-Calavi",
    budget: 95000,
    habits: ["Non-fumeur", "Lève-tôt", "Ordonné"],
    compatibility: 76,
    bio: "Ingénieur civil en dernière année, méthodique et respectueux.",
  },
  {
    id: "rm-007",
    pseudo: "Esther A.",
    age: 19,
    gender: "female",
    discipline: "Sciences humaines",
    school: "UAC - FLASH",
    city: "Cotonou",
    budget: 60000,
    habits: ["Sociable", "Non-fumeuse", "Accepte animaux"],
    compatibility: 72,
    bio: "L1 sociologie, j'ai un petit chat très calme, je cherche une coloc fun.",
  },
  {
    id: "rm-008",
    pseudo: "Jules N.",
    age: 22,
    gender: "male",
    discipline: "Sciences exactes",
    school: "FAST",
    city: "Cotonou",
    budget: 75000,
    habits: ["Calme", "Lève-tôt", "Non-fumeur"],
    compatibility: 69,
    bio: "Étudiant en maths, plutôt introverti, j'aime la lecture et les balades.",
  },
];

function getCompatibilityColor(score: number) {
  if (score >= 85) return "bg-kaza-green text-white";
  if (score >= 75) return "bg-kaza-blue text-white";
  return "bg-kaza-warning/15 text-kaza-warning";
}

function genderInitial(g: "female" | "male") {
  return g === "female" ? "F" : "H";
}

export default function RoommateMatchingPage() {
  function handleContact(pseudo: string) {
    alert(
      `Votre demande de contact a été envoyée à ${pseudo}. ` +
        `Vous serez notifié dès qu'elle ou il accepte de discuter avec vous.`
    );
  }

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

        {/* Grille profils */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {MOCK_PROFILES.length} colocataires
              </span>{" "}
              correspondent à vos critères
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {MOCK_PROFILES.map((profile) => (
              <Card
                key={profile.id}
                className="overflow-hidden transition-all hover:shadow-md"
              >
                <CardHeader className="border-b pb-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar placeholder */}
                    <div className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-kaza-blue to-kaza-navy text-lg font-bold text-white">
                      {profile.pseudo.charAt(0)}
                      <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-foreground">
                        {genderInitial(profile.gender)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-base font-semibold text-foreground">
                          {profile.pseudo}
                        </p>
                        <span
                          className={
                            "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold " +
                            getCompatibilityColor(profile.compatibility)
                          }
                          title="Score de compatibilité"
                        >
                          <Sparkles className="size-3" />
                          {profile.compatibility}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {profile.age} ans
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-4">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="size-3.5 text-kaza-blue" />
                      <span className="truncate">
                        {profile.discipline} • {profile.school}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-3.5 text-kaza-blue" />
                      <span>{profile.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wallet className="size-3.5 text-kaza-blue" />
                      <span>
                        Budget :{" "}
                        <span className="font-semibold text-foreground">
                          {formatPrice(profile.budget)}
                        </span>{" "}
                        / mois
                      </span>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-xs italic text-muted-foreground">
                    « {profile.bio} »
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {profile.habits.map((h) => (
                      <Badge
                        key={h}
                        variant="outline"
                        className="border-kaza-blue/30 bg-kaza-blue/5 text-[10px] font-medium text-kaza-blue"
                      >
                        {h}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-4">
                  <Button
                    type="button"
                    onClick={() => handleContact(profile.pseudo)}
                    className="w-full gap-2 bg-kaza-blue text-white hover:bg-kaza-blue/90"
                  >
                    <MessageCircle className="size-4" />
                    Demander à contacter
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
