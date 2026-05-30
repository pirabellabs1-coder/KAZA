"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Crown,
  Eye,
  Loader2,
  Megaphone,
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
import {
  activateBoost,
  cancelBoost,
  type ActiveBoostDTO,
} from "@/actions/boosts";

interface BoostPlan {
  id: "boost7" | "boost30" | "premium";
  // Valeur persistée en DB (`property_boosts.plan`).
  dbPlan: "featured" | "top" | "premium";
  title: string;
  duration: number; // jours
  price: number;
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
  features: string[];
  uplift: string;
}

interface UserProperty {
  id: string;
  title: string;
}

const BOOST_PLANS: BoostPlan[] = [
  {
    id: "boost7",
    dbPlan: "featured",
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
    dbPlan: "top",
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
    dbPlan: "premium",
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

// Comparaison avant/après — placeholder marketing générique sans chiffre
// inventé. Le tableau dynamique réel viendra brancher analytics dédiés.
const COMPARISON_ROWS: Array<{
  label: string;
  icon: typeof Eye;
  before: string;
  after: string;
}> = [];

function formatPrice(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`;
}

function getPlan(id: BoostPlan["id"]): BoostPlan {
  return BOOST_PLANS.find((p) => p.id === id) ?? BOOST_PLANS[0]!;
}

function planFromDb(dbPlan: string): BoostPlan {
  return BOOST_PLANS.find((p) => p.dbPlan === dbPlan) ?? BOOST_PLANS[0]!;
}

const ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "Vous devez être connecté pour booster une annonce.",
  NOT_OWNER: "Cette annonce ne vous appartient pas.",
  NOT_FOUND: "Annonce introuvable.",
  INSUFFICIENT_FUNDS:
    "Solde KAZA Wallet insuffisant. Rechargez votre wallet pour activer ce boost.",
  WALLET_FROZEN: "Votre wallet est gelé. Contactez le support.",
  INVALID_INPUT: "Données invalides.",
};

interface PromotionClientProps {
  properties: UserProperty[];
  initialBoosts: ActiveBoostDTO[];
}

export function PromotionClient({
  properties,
  initialBoosts,
}: PromotionClientProps) {
  const hasProperties = properties.length > 0;
  const [propertyId, setPropertyId] = useState<string>(
    hasProperties ? properties[0]!.id : "",
  );
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan["id"]>("boost30");
  const [boosts, setBoosts] = useState<ActiveBoostDTO[]>(initialBoosts);
  const [isPending, startTransition] = useTransition();

  const plan = useMemo(() => getPlan(selectedPlan), [selectedPlan]);
  const property = useMemo(
    () => properties.find((p) => p.id === propertyId) ?? null,
    [properties, propertyId],
  );

  function handleActivate(): void {
    if (!property) {
      toast.error("Sélectionnez d'abord une annonce à booster.");
      return;
    }
    startTransition(async () => {
      const res = await activateBoost({
        propertyId: property.id,
        plan: plan.dbPlan,
        days: plan.duration,
        amount: plan.price,
      });

      if (!res.success) {
        toast.error(
          ERROR_MESSAGES[res.error ?? ""] ??
            "Impossible d'activer le boost. Réessayez.",
        );
        return;
      }

      const now = new Date();
      const newBoost: ActiveBoostDTO = {
        id: res.boostId ?? `boost-${now.getTime()}`,
        propertyId: property.id,
        propertyTitle: property.title,
        plan: plan.dbPlan,
        amount: plan.price,
        startedAt: now.toISOString(),
        endsAt: new Date(
          now.getTime() + plan.duration * 24 * 60 * 60 * 1000,
        ).toISOString(),
        status: "ACTIVE",
      };
      setBoosts((prev) => [newBoost, ...prev]);
      toast.success(`Boost activé pour « ${property.title} ».`);
    });
  }

  function handleStop(id: string): void {
    startTransition(async () => {
      const res = await cancelBoost(id);
      if (!res.success) {
        toast.error("Impossible d'arrêter la campagne.");
        return;
      }
      setBoosts((prev) => prev.filter((b) => b.id !== id));
      toast.info("Campagne arrêtée.");
    });
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
          Paiement via KAZA Wallet
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
          {hasProperties ? (
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger className="w-full sm:max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Vous n&apos;avez encore aucune annonce publiée. Publiez d&apos;abord
              un bien pour pouvoir le booster.
            </div>
          )}
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
              <span className="font-semibold">{plan.title}</span>
              {property ? (
                <>
                  {" "}
                  pour <span className="font-semibold">{property.title}</span>
                </>
              ) : null}
            </p>
            <p className="mt-1 text-2xl font-bold text-kaza-blue">
              {formatPrice(plan.price)}
            </p>
          </div>
          <Button
            size="lg"
            className="bg-kaza-blue hover:bg-kaza-blue/90"
            onClick={handleActivate}
            disabled={isPending || !property}
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
              const planMeta = planFromDb(boost.plan);
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
                        disabled={isPending}
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

      {/* Comparaison avant/après — branché plus tard sur analytics_boost_impact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Comparaison avant / après boost
          </CardTitle>
        </CardHeader>
        <CardContent>
          {COMPARISON_ROWS.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
                <TrendingUp className="size-6 text-kaza-blue" />
              </div>
              <p className="mt-3 font-heading text-base font-semibold text-kaza-navy">
                Données insuffisantes pour ce graphique
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Lancez votre premier boost pour comparer ici l&apos;impact
                observé (vues, messages, demandes de visite, délai de location).
              </p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
