"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Crown,
  Eye,
  Loader2,
  Megaphone,
  MessageCircle,
  Rocket,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

interface BoostPlan {
  id: "boost7" | "boost30" | "premium";
  title: string;
  duration: number; // jours
  price: number;
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
  features: string[];
  uplift: string;
}

interface ActiveBoost {
  id: string;
  propertyId: string;
  propertyTitle: string;
  planId: BoostPlan["id"];
  startedAt: string;
  endsAt: string;
}

const BOOST_PLANS: BoostPlan[] = [
  {
    id: "boost7",
    title: "Boost 7 jours",
    duration: 7,
    price: 5000,
    icon: Zap,
    features: [
      "Mise en avant dans les résultats",
      "Badge « Boosté »",
      "Statistiques de portée",
    ],
    uplift: "+ x2 vues estimées",
  },
  {
    id: "boost30",
    title: "Boost 30 jours",
    duration: 30,
    price: 15000,
    icon: Rocket,
    recommended: true,
    features: [
      "Top des résultats pendant 30 jours",
      "Badge « Populaire »",
      "Notification push aux locataires ciblés",
      "Rapport de performance hebdomadaire",
    ],
    uplift: "+ x4 vues estimées",
  },
  {
    id: "premium",
    title: "Pack Premium",
    duration: 30,
    price: 50000,
    icon: Crown,
    features: [
      "1ère position garantie (30j)",
      "Mise en avant page d'accueil",
      "Reportage photo professionnel (1 séance)",
      "Conseiller dédié",
      "Statistiques avancées",
    ],
    uplift: "+ x10 vues estimées",
  },
];

const MOCK_PROPERTIES = [
  { id: "prop-001", title: "Bel appartement T3 — Fidjrossè" },
  { id: "prop-002", title: "Studio meublé — Cocotiers" },
  { id: "prop-003", title: "Villa 5 pièces avec jardin — Calavi" },
  { id: "prop-004", title: "Chambre étudiante — Université d'Abomey-Calavi" },
];

const SEED_ACTIVE: ActiveBoost[] = [
  {
    id: "boost-seed-1",
    propertyId: "prop-001",
    propertyTitle: "Bel appartement T3 — Fidjrossè",
    planId: "boost30",
    startedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "boost-seed-2",
    propertyId: "prop-002",
    propertyTitle: "Studio meublé — Cocotiers",
    planId: "boost7",
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const STORAGE_KEY = "kaza-boosts";

const COMPARISON_ROWS = [
  { label: "Vues / jour", icon: Eye, before: "18", after: "92" },
  { label: "Messages reçus / sem.", icon: MessageCircle, before: "2", after: "11" },
  {
    label: "Demandes de visite / sem.",
    icon: Sparkles,
    before: "1",
    after: "6",
  },
  {
    label: "Délai moyen de location",
    icon: TrendingUp,
    before: "42 jours",
    after: "11 jours",
  },
];

function formatPrice(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`;
}

function getPlan(id: BoostPlan["id"]): BoostPlan {
  return BOOST_PLANS.find((p) => p.id === id) ?? BOOST_PLANS[0];
}

export default function PromotionPage() {
  const [propertyId, setPropertyId] = useState<string>(MOCK_PROPERTIES[0].id);
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan["id"]>("boost30");
  const [boosts, setBoosts] = useState<ActiveBoost[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ActiveBoost[];
        if (Array.isArray(parsed)) {
          setBoosts(parsed);
          return;
        }
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ACTIVE));
      setBoosts(SEED_ACTIVE);
    } catch {
      setBoosts(SEED_ACTIVE);
    }
  }, []);

  function persist(next: ActiveBoost[]): void {
    setBoosts(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  const plan = useMemo(() => getPlan(selectedPlan), [selectedPlan]);
  const property = useMemo(
    () => MOCK_PROPERTIES.find((p) => p.id === propertyId) ?? MOCK_PROPERTIES[0],
    [propertyId],
  );

  function handleActivate(): void {
    startTransition(() => {
      const now = Date.now();
      const newBoost: ActiveBoost = {
        id: `boost-${now}`,
        propertyId: property.id,
        propertyTitle: property.title,
        planId: plan.id,
        startedAt: new Date(now).toISOString(),
        endsAt: new Date(now + plan.duration * 24 * 60 * 60 * 1000).toISOString(),
      };
      persist([newBoost, ...boosts]);
      toast.success(`Boost activé pour « ${property.title} ».`);
    });
  }

  function handleStop(id: string): void {
    persist(boosts.filter((b) => b.id !== id));
    toast.info("Campagne arrêtée.");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            <Megaphone className="mr-2 inline size-7 text-kaza-blue" />
            Booster vos annonces
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Augmentez la visibilité de vos biens et louez plus vite.
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs">
          Paiement Mobile Money sécurisé
        </Badge>
      </div>

      {/* Sélection annonce */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            1. Choisir l&apos;annonce à booster
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger className="w-full sm:max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_PROPERTIES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="mb-3 font-heading text-base font-semibold">
          2. Choisir un plan
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {BOOST_PLANS.map((p) => {
            const selected = selectedPlan === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlan(p.id)}
                className={cn(
                  "relative flex flex-col rounded-xl border-2 bg-card p-5 text-left transition",
                  selected
                    ? "border-kaza-blue shadow-lg"
                    : "border-border hover:border-kaza-blue/50",
                )}
              >
                {p.recommended && (
                  <Badge className="absolute -top-2.5 left-4 bg-kaza-green text-white">
                    Recommandé
                  </Badge>
                )}
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      selected
                        ? "bg-kaza-blue text-white"
                        : "bg-muted text-kaza-navy",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.duration} jours
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-2xl font-bold">{formatPrice(p.price)}</p>
                  <p className="text-xs text-kaza-green">{p.uplift}</p>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-kaza-green" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-end">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border-2",
                      selected
                        ? "border-kaza-blue bg-kaza-blue"
                        : "border-border",
                    )}
                  >
                    {selected && (
                      <CheckCircle2 className="size-5 text-white" />
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Récap */}
      <Card className="border-kaza-blue/30 bg-kaza-blue/5">
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Récapitulatif
            </p>
            <p className="mt-1 text-sm">
              <span className="font-semibold">{plan.title}</span> pour{" "}
              <span className="font-semibold">{property.title}</span>
            </p>
            <p className="mt-1 text-2xl font-bold text-kaza-blue">
              {formatPrice(plan.price)}
            </p>
          </div>
          <Button
            size="lg"
            className="bg-kaza-blue hover:bg-kaza-blue/90"
            onClick={handleActivate}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            Payer et activer
          </Button>
        </CardContent>
      </Card>

      {/* Campagnes actives */}
      <div>
        <h2 className="mb-3 font-heading text-base font-semibold">
          Mes campagnes actives
        </h2>
        {boosts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aucune campagne active pour le moment.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {boosts.map((boost) => {
              const planMeta = getPlan(boost.planId);
              const start = new Date(boost.startedAt).getTime();
              const end = new Date(boost.endsAt).getTime();
              const now = Date.now();
              const total = Math.max(end - start, 1);
              const elapsed = Math.min(Math.max(now - start, 0), total);
              const remainingDays = Math.max(
                Math.ceil((end - now) / (24 * 60 * 60 * 1000)),
                0,
              );
              const progress = Math.round((elapsed / total) * 100);
              const Icon = planMeta.icon;
              return (
                <Card key={boost.id}>
                  <CardContent className="space-y-3 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">
                            {boost.propertyTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {planMeta.title}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleStop(boost.id)}
                      >
                        <X className="mr-1 size-3.5" />
                        Arrêter
                      </Button>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {remainingDays} jour{remainingDays > 1 ? "s" : ""}{" "}
                          restant{remainingDays > 1 ? "s" : ""}
                        </span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparaison avant/après */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Comparaison avant / après boost (moyenne observée)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Indicateur</th>
                  <th className="px-4 py-2">
                    <span className="inline-flex items-center gap-1">
                      <ArrowDown className="size-3" /> Avant
                    </span>
                  </th>
                  <th className="px-4 py-2">
                    <span className="inline-flex items-center gap-1 text-kaza-green">
                      <ArrowUp className="size-3" /> Après
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => {
                  const Icon = row.icon;
                  return (
                    <tr key={row.label} className="border-t">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <Icon className="size-4 text-muted-foreground" />
                          {row.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.before}
                      </td>
                      <td className="px-4 py-3 font-semibold text-kaza-green">
                        {row.after}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
