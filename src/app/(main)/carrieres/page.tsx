import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Globe2, HeartHandshake, MapPin, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Carrières",
  description:
    "Rejoignez la révolution immobilière en Afrique. Découvrez nos postes ouverts chez KAZA.",
};

const PERKS = [
  {
    icon: HeartHandshake,
    title: "Mission à impact",
    description:
      "Transformez l'accès au logement pour des millions d'Africains. Chaque ligne de code compte.",
  },
  {
    icon: Globe2,
    title: "Équipe panafricaine",
    description:
      "Talents distribués entre Cotonou, Lomé, Abidjan et au-delà. Remote first, hubs physiques.",
  },
  {
    icon: TrendingUp,
    title: "Stock options",
    description:
      "Tous les employés participent au capital. Salaires compétitifs + BSPCE.",
  },
];

export const JOBS = [
  {
    slug: "senior-frontend-engineer",
    title: "Senior Frontend Engineer",
    location: "Cotonou / Remote",
    type: "CDI",
    team: "Engineering",
    summary:
      "Vous architecturez et faites évoluer notre application Next.js 15 utilisée par des dizaines de milliers de visiteurs chaque mois.",
  },
  {
    slug: "senior-backend-engineer",
    title: "Senior Backend Engineer",
    location: "Cotonou / Remote",
    type: "CDI",
    team: "Engineering",
    summary:
      "Vous concevez nos API, schémas Postgres/PostGIS et l'intégration avec FedaPay, Twilio et Resend.",
  },
  {
    slug: "product-designer",
    title: "Product Designer",
    location: "Lomé / Remote",
    type: "CDI",
    team: "Design",
    summary:
      "Vous portez la voix de nos utilisateurs et façonnez l'expérience de bout en bout — du parcours locataire au tableau de bord propriétaire.",
  },
  {
    slug: "growth-marketing-manager",
    title: "Growth Marketing Manager",
    location: "Cotonou",
    type: "CDI",
    team: "Marketing",
    summary:
      "Vous pilotez l'acquisition, la rétention et nos partenariats locaux pour faire passer KAZA à l'échelle.",
  },
  {
    slug: "customer-success",
    title: "Customer Success",
    location: "Cotonou",
    type: "CDI",
    team: "Operations",
    summary:
      "Vous accompagnez nos utilisateurs propriétaires et locataires, résolvez les litiges et collectez les insights produit.",
  },
  {
    slug: "account-executive",
    title: "Account Executive",
    location: "Abidjan",
    type: "CDI",
    team: "Sales",
    summary:
      "Vous ouvrez le marché ivoirien : agences immobilières, résidences universitaires, gestionnaires de patrimoine.",
  },
];

export default function CarrieresPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-kaza-navy py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <Badge className="mb-4 bg-kaza-green/20 text-kaza-green">
            Recrutement
          </Badge>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
            Rejoignez la révolution immobilière en Afrique
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Nous construisons la plus grande plateforme d&apos;immobilier
            d&apos;Afrique de l&apos;Ouest. Si vous voulez avoir un impact
            tangible et mesurable, vous êtes au bon endroit.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <h2 className="text-center font-heading text-2xl font-bold sm:text-3xl">
            Pourquoi KAZA ?
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PERKS.map((perk) => (
              <Card key={perk.title}>
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue">
                    <perk.icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold">
                    {perk.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {perk.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                Postes ouverts
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {JOBS.length} opportunités à pourvoir
              </p>
            </div>
            <Briefcase className="size-8 text-muted-foreground" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {JOBS.map((job) => (
              <Link
                key={job.slug}
                href={`/carrieres/${job.slug}`}
                className="group block"
              >
                <Card className="h-full transition hover:border-kaza-blue hover:shadow-md">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-heading text-lg font-semibold group-hover:text-kaza-blue">
                        {job.title}
                      </h3>
                      <Badge variant="outline">{job.team}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {job.location}
                      </span>
                      <span>•</span>
                      <span>{job.type}</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {job.summary}
                    </p>
                    <p className="text-sm font-medium text-kaza-blue">
                      Voir le poste →
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Vous ne voyez pas le poste qui vous correspond ? Écrivez-nous à{" "}
            <a
              href="mailto:careers@kaza.africa"
              className="font-medium text-kaza-blue hover:underline"
            >
              careers@kaza.africa
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
