import type { Metadata } from "next";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { RatingSummary } from "@/components/reviews/rating-summary";
import { ReviewList } from "@/components/reviews/review-list";
import type { ReviewItem } from "@/components/reviews/review-card";

export const metadata: Metadata = {
  title: "Mes évaluations",
};

const REVIEWS: ReviewItem[] = [
  {
    id: "r-001",
    authorName: "Thomas Adjovi",
    authorAvatar: null,
    rating: 5,
    date: "2026-05-12T10:00:00.000Z",
    propertyId: "p-001",
    propertyTitle: "Appartement T3 — Fidjrosse",
    comment:
      "Excellent propriétaire, très réactif. L'appartement est conforme aux photos, propre et bien situé. Je recommande vivement ce logement à toute personne cherchant un cadre paisible à Cotonou.",
  },
  {
    id: "r-002",
    authorName: "Fatou Diallo",
    authorAvatar: null,
    rating: 5,
    date: "2026-05-02T08:30:00.000Z",
    propertyId: "p-002",
    propertyTitle: "Studio meublé — Akpakpa",
    comment:
      "Tout s'est passé à merveille du premier contact à la remise des clés. Logement impeccable, propriétaire de confiance.",
  },
  {
    id: "r-003",
    authorName: "Marie Hounkpatin",
    authorAvatar: null,
    rating: 4,
    date: "2026-04-20T18:14:00.000Z",
    propertyId: "p-003",
    propertyTitle: "Villa 4 chambres — Calavi",
    comment:
      "Très belle villa, bien entretenue, dans un quartier calme. Quelques petits travaux à prévoir mais le propriétaire est très réactif lorsqu'on le signale. Une petite amélioration au niveau de la plomberie serait appréciée pour la prochaine location.",
  },
  {
    id: "r-004",
    authorName: "Kossi Mensah",
    authorAvatar: null,
    rating: 5,
    date: "2026-04-15T09:00:00.000Z",
    propertyId: "p-001",
    propertyTitle: "Appartement T3 — Fidjrosse",
    comment:
      "Parfait du début à la fin. Le bail a été signé en ligne sans accroc et le propriétaire répond toujours rapidement.",
  },
  {
    id: "r-005",
    authorName: "Aïcha Bello",
    authorAvatar: null,
    rating: 4,
    date: "2026-04-05T15:42:00.000Z",
    propertyId: "p-002",
    propertyTitle: "Studio meublé — Akpakpa",
    comment:
      "Très bon rapport qualité/prix. Le studio est petit mais bien aménagé.",
  },
  {
    id: "r-006",
    authorName: "Mamadou Sow",
    authorAvatar: null,
    rating: 3,
    date: "2026-03-22T11:18:00.000Z",
    propertyId: "p-003",
    propertyTitle: "Villa 4 chambres — Calavi",
    comment:
      "La villa est conforme mais la connexion internet annoncée n'était pas installée à mon arrivée. Le propriétaire a réglé le problème en 2 jours.",
  },
  {
    id: "r-007",
    authorName: "Sandrine Codjo",
    authorAvatar: null,
    rating: 5,
    date: "2026-03-10T07:50:00.000Z",
    propertyId: "p-001",
    propertyTitle: "Appartement T3 — Fidjrosse",
    comment: "Rien à redire. Très bonne expérience.",
  },
  {
    id: "r-008",
    authorName: "Patrick Dossou",
    authorAvatar: null,
    rating: 2,
    date: "2026-02-28T20:05:00.000Z",
    propertyId: "p-004",
    propertyTitle: "Chambre étudiante — UAC",
    comment:
      "Logement correct mais bruyant le soir, à cause de la rue principale juste à côté. Le propriétaire est néanmoins très arrangeant.",
  },
];

const summary = (() => {
  const total = REVIEWS.length;
  const sum = REVIEWS.reduce((s, r) => s + r.rating, 0);
  const average = total > 0 ? sum / total : 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
    1 | 2 | 3 | 4 | 5,
    number
  >;
  for (const r of REVIEWS) {
    const k = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
    if (k >= 1 && k <= 5) distribution[k] += 1;
  }
  return { total, average, distribution };
})();

const FILTERS = {
  all: () => true,
  "5": (r: ReviewItem) => r.rating === 5,
  "4": (r: ReviewItem) => r.rating === 4,
  low: (r: ReviewItem) => r.rating <= 3,
} as const;

export default function OwnerReviewsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes évaluations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez les avis laissés par vos locataires et visiteurs.
        </p>
      </div>

      <RatingSummary
        average={summary.average}
        total={summary.total}
        distribution={summary.distribution}
      />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full max-w-md overflow-x-auto">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="5">5★</TabsTrigger>
          <TabsTrigger value="4">4★</TabsTrigger>
          <TabsTrigger value="low">3★ et moins</TabsTrigger>
        </TabsList>

        {(Object.keys(FILTERS) as Array<keyof typeof FILTERS>).map((key) => {
          const filtered = REVIEWS.filter(FILTERS[key]);
          return (
            <TabsContent key={key} value={key} className="mt-4">
              <ReviewList reviews={filtered} />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
