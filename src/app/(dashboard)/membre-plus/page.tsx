import type { Metadata } from "next";
import Link from "next/link";
import {
  Crown,
  Wallet,
  Sparkles,
  Star,
  Megaphone,
  LineChart,
  Headphones,
  ShieldCheck,
  FolderLock,
  ConciergeBell,
  MessageSquare,
  Settings,
  History,
} from "lucide-react";

import { StatsCard } from "@/components/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Espace Membre Plus — KAZA",
  description:
    "Pilotez vos avantages Plus, votre concierge personnel et votre abonnement Premium.",
};

const formatFcfa = (value: number) =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

type ActiveBenefit = {
  title: string;
  description: string;
  icon: typeof Megaphone;
  status: "Actif" | "Disponible";
};

const activeBenefits: ActiveBenefit[] = [
  {
    icon: Megaphone,
    title: "Boost mensuel",
    description: "Annonce mise en avant 7 jours. Prochain boost disponible le 1er juin.",
    status: "Actif",
  },
  {
    icon: LineChart,
    title: "Analytics privées",
    description: "Statistiques détaillées sur vos annonces et recherches.",
    status: "Actif",
  },
  {
    icon: Headphones,
    title: "Support 24/7",
    description: "Chat et appel prioritaires. Temps de réponse moyen : 23 min.",
    status: "Actif",
  },
  {
    icon: ShieldCheck,
    title: "Identité Premium",
    description: "Badge Plus vérifié visible sur votre profil public.",
    status: "Actif",
  },
  {
    icon: FolderLock,
    title: "Stockage illimité",
    description: "Tous vos contrats et justificatifs sécurisés.",
    status: "Actif",
  },
  {
    icon: ConciergeBell,
    title: "Concierge personnel",
    description: "Votre interlocuteur dédié : Awa Diakité.",
    status: "Disponible",
  },
];

const benefitHistory = [
  {
    label: "Boost annonce — Studio Akpakpa",
    date: "15 mai 2026",
    saved: 5_000,
  },
  {
    label: "Validation identité express",
    date: "12 mai 2026",
    saved: 3_000,
  },
  {
    label: "Concierge — Recherche colocation",
    date: "8 mai 2026",
    saved: 15_000,
  },
  {
    label: "Support prioritaire — Ticket #4821",
    date: "4 mai 2026",
    saved: 2_500,
  },
  {
    label: "Boost annonce — Appartement Cadjehoun",
    date: "1 mai 2026",
    saved: 5_000,
  },
  {
    label: "Stockage docs étendu — contrat bail",
    date: "27 avril 2026",
    saved: 1_500,
  },
];

export default function PlusDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 p-6 text-kaza-navy shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge className="mb-2 border-kaza-navy/20 bg-kaza-navy text-white hover:bg-kaza-navy/90">
              <Crown className="mr-1 size-3" />
              Plus
            </Badge>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">
              Espace Membre Plus
            </h1>
            <p className="mt-1 text-sm text-kaza-navy/80">
              Membre Plus depuis janvier 2026 · Renouvellement le 1er janvier 2027
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-kaza-navy bg-white/40 text-kaza-navy hover:bg-white/70"
          >
            <Link href="/settings#subscription">
              <Settings className="mr-2 size-4" />
              Gérer mon abonnement
            </Link>
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Économies réalisées"
          value={formatFcfa(0)}
          subtitle="depuis l'adhésion"
          icon={Wallet}
        />
        <StatsCard
          title="Avantages utilisés"
          value="0 / 30"
          subtitle="ce mois-ci"
          icon={Sparkles}
        />
        <StatsCard
          title="Points bonus Plus"
          value="0"
          subtitle="Échangeables en récompenses"
          icon={Star}
        />
      </section>

      {/* Avantages actifs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            Mes avantages actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeBenefits.map((benefit) => {
              const Icon = benefit.icon;
              const isActive = benefit.status === "Actif";
              return (
                <article
                  key={benefit.title}
                  className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/40 p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <Icon className="size-5" />
                    </div>
                    <Badge
                      className={
                        isActive
                          ? "bg-kaza-green/10 text-kaza-green hover:bg-kaza-green/20"
                          : "bg-kaza-blue/10 text-kaza-blue hover:bg-kaza-blue/20"
                      }
                      variant="secondary"
                    >
                      {benefit.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-kaza-navy">{benefit.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Concierge KAZA — chat placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ConciergeBell className="size-5 text-amber-500" />
            Concierge KAZA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-br from-amber-50 to-white p-5 sm:flex-row sm:items-center">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-amber-500 text-lg font-bold text-white">
              AD
            </div>
            <div className="flex-1">
              <p className="font-semibold text-kaza-navy">Awa Diakité</p>
              <p className="text-xs text-muted-foreground">
                Votre concierge personnel · Disponible 24/7
              </p>
              <p className="mt-2 text-sm text-foreground">
                « Bonjour ! Je suis là pour vous aider à trouver, négocier ou gérer
                votre prochain logement. Dites-moi simplement ce dont vous avez besoin. »
              </p>
            </div>
            <Button className="bg-amber-500 text-white hover:bg-amber-500/90">
              <MessageSquare className="mr-2 size-4" />
              Démarrer le chat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5 text-kaza-blue" />
            Historique des avantages utilisés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {benefitHistory.map((item) => (
              <li
                key={item.label}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <p className="text-sm font-semibold text-kaza-green">
                  Économie : {formatFcfa(item.saved)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
