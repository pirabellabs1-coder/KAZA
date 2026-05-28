import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CreditCard,
  Calendar,
  Wallet,
  Receipt,
  Download,
  Eye,
  Check,
  Building2,
  Users,
  Rocket,
  HardDrive,
  Sparkles,
  ShieldCheck,
  Pencil,
  AlertTriangle,
  TrendingUp,
  FileText,
  HelpCircle,
  Crown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getActiveSubscription,
  listUserInvoices,
  PLAN_DETAILS,
} from "@/lib/queries/subscriptions";
import { formatFcfa } from "@/lib/utils";
import { SubscribeButton } from "@/components/subscriptions/subscribe-button";
import { CancelSubscriptionButton } from "@/components/subscriptions/cancel-subscription-button";

// Fallback vide — à brancher quand la table agency_profiles sera en place.
const AGENCY_PROFILE = {
  legalName: "",
  rccm: "",
  ifu: "",
};

export const metadata: Metadata = {
  title: "Facturation — KAZA Agence",
  description:
    "Gérez votre abonnement KAZA Pro, vos factures et vos moyens de paiement.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INVOICE_STATUS_LABEL: Record<string, string> = {
  PAID: "Payée",
  PENDING: "En attente",
  FAILED: "Échouée",
  REFUNDED: "Remboursée",
};

const INVOICE_STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  PENDING: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  FAILED: "bg-rose-100 text-rose-700 hover:bg-rose-100",
  REFUNDED: "bg-slate-100 text-slate-700 hover:bg-slate-100",
};

const formatDateFr = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

// Catalogue agence (3 plans Pro) ordonné pour le comparateur
const AGENCY_PLAN_KEYS = ["PRO_STARTER", "PRO_PREMIUM", "PRO_ELITE"] as const;

// Quotas par défaut associés à chaque plan Pro (sert d'affichage —
// le suivi réel viendra brancher properties/team_members/storage)
const PLAN_QUOTAS: Record<
  string,
  { activeListings: number; teamMembers: number; boostsPerMonth: number; storageGB: number }
> = {
  PRO_STARTER: { activeListings: 50, teamMembers: 5, boostsPerMonth: 3, storageGB: 10 },
  PRO_PREMIUM: { activeListings: 200, teamMembers: 15, boostsPerMonth: 10, storageGB: 50 },
  PRO_ELITE: { activeListings: 9999, teamMembers: 9999, boostsPerMonth: 9999, storageGB: 200 },
};

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function QuotaCard({
  label,
  used,
  max,
  unit,
  icon: Icon,
}: {
  label: string;
  used: number;
  max: number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isUnlimited = max >= 9999;
  const percentage = isUnlimited
    ? 0
    : Math.min(100, Math.round((used / max) * 100));
  const isWarning = !isUnlimited && percentage > 80;
  const isDanger = !isUnlimited && percentage > 95;

  const barColor = isDanger
    ? "bg-rose-500"
    : isWarning
      ? "bg-amber-500"
      : "bg-kaza-blue";

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Icon className="size-4 text-kaza-blue" />
            {label}
          </div>
          {isWarning && (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
              {isDanger ? "Limite atteinte" : "Proche limite"}
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <p className="font-heading text-2xl font-bold text-kaza-navy">
            {used}
            {unit ? <span className="text-base text-muted-foreground"> {unit}</span> : null}
          </p>
          <p className="text-sm text-muted-foreground">
            / {isUnlimited ? "∞" : max}
            {unit && !isUnlimited ? ` ${unit}` : ""}
          </p>
        </div>
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-right text-xs text-muted-foreground">
            {isUnlimited ? "Illimité" : `${percentage} %`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty state (pas d'abonnement actif)
// ---------------------------------------------------------------------------

function NoSubscriptionState({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
          Facturation &amp; abonnement
        </h1>
        <p className="text-sm text-muted-foreground">
          Souscrivez à un plan KAZA Pro pour gérer votre agence.
        </p>
      </header>

      <section className="rounded-2xl bg-gradient-to-br from-kaza-navy via-kaza-navy to-kaza-blue p-10 text-white shadow-sm">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-400/15">
            <Crown className="size-8 text-amber-300" />
          </div>
          <h2 className="font-heading text-3xl font-bold">
            Aucun abonnement actif
          </h2>
          <p className="mt-3 text-white/85">
            Choisissez l&apos;une de nos 3 formules KAZA Pro pour débloquer la
            gestion d&apos;agence : annonces illimitées, équipe, boosts,
            analytics et bien plus.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="bg-amber-400 text-kaza-navy hover:bg-amber-400/90"
            >
              <Link href="/pricing">
                <Sparkles className="mr-2 size-4" />
                Voir les plans &amp; tarifs
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comparateur de plans */}
      <section>
        <div className="mb-4">
          <h2 className="font-heading text-xl font-bold text-kaza-navy">
            Nos formules KAZA Pro
          </h2>
          <p className="text-sm text-muted-foreground">
            Souscription immédiate, sans engagement, résiliable à tout moment.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {AGENCY_PLAN_KEYS.map((planKey) => {
            const plan = PLAN_DETAILS[planKey];
            const isPremium = planKey === "PRO_PREMIUM";
            const isElite = planKey === "PRO_ELITE";
            return (
              <Card
                key={planKey}
                className={
                  isPremium
                    ? "relative border-2 border-kaza-blue shadow-lg"
                    : "relative border-border/70"
                }
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-kaza-blue text-white hover:bg-kaza-blue">
                      Recommandé
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-lg text-kaza-navy">
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline gap-1">
                    <p className="font-heading text-3xl font-bold text-kaza-navy">
                      {formatFcfa(plan.priceMonthly)}
                    </p>
                    <span className="text-sm text-muted-foreground">/ mois</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-kaza-green" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <SubscribeButton
                    plan={planKey}
                    label={`Choisir ${plan.name}`}
                    isAuthenticated={isAuthenticated}
                    signupRoleSuffix="&role=agency"
                    className={
                      isElite
                        ? "w-full bg-kaza-navy text-white hover:bg-kaza-navy/90"
                        : "w-full"
                    }
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgencyBillingPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?next=/agency/billing");
  }

  const [sub, invoices] = await Promise.all([
    getActiveSubscription(user.id),
    listUserInvoices(user.id),
  ]);

  // Empty state — pas d'abonnement actif
  if (!sub) {
    return <NoSubscriptionState isAuthenticated />;
  }

  const planDetails = PLAN_DETAILS[sub.plan];
  const quotas = PLAN_QUOTAS[sub.plan] ?? PLAN_QUOTAS.PRO_STARTER;

  // Total facturé YTD (année en cours)
  const currentYear = String(new Date().getFullYear());
  const totalYTD = invoices
    .filter((i) => i.status === "PAID" && i.issuedAt.startsWith(currentYear))
    .reduce((acc, i) => acc + i.amount, 0);

  // Quotas réels — pour le MVP, on affiche les limites du plan avec
  // une utilisation neutre (à brancher sur properties/team_members)
  const quotaDisplay = {
    activeListings: { used: 0, max: quotas.activeListings },
    teamMembers: { used: 1, max: quotas.teamMembers },
    boostsPerMonth: { used: 0, max: quotas.boostsPerMonth },
    storageGB: { used: 0, max: quotas.storageGB },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
          Facturation &amp; abonnement
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez votre abonnement KAZA Pro, vos factures et vos moyens de paiement.
        </p>
      </header>

      {/* HERO Plan actuel */}
      <section className="rounded-2xl bg-gradient-to-br from-kaza-navy via-kaza-navy to-kaza-blue p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-amber-300/40 bg-amber-400 text-kaza-navy hover:bg-amber-400">
                <Sparkles className="mr-1 size-3" />
                {sub.status === "TRIAL" ? "ESSAI" : "ACTIF"}
              </Badge>
              <span className="text-xs uppercase tracking-wider text-white/70">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              {planDetails?.name ?? sub.plan}
            </h2>
            <div className="flex flex-wrap items-baseline gap-3">
              <p className="font-heading text-3xl font-bold sm:text-4xl">
                {formatFcfa(sub.monthlyPrice)}
                <span className="text-base font-medium text-white/75"> / mois</span>
              </p>
            </div>
            <div className="grid gap-3 pt-2 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 text-white/85">
                <Calendar className="size-4" />
                <span>Prochaine facturation :</span>
                <strong className="text-white">
                  {formatDateFr(sub.currentPeriodEnd)}
                </strong>
              </div>
              <div className="flex items-center gap-2 text-white/85">
                <Wallet className="size-4" />
                <span>Moyen de paiement :</span>
                <strong className="text-white">
                  {sub.paymentMethod ?? "—"}
                </strong>
              </div>
              <div className="flex items-center gap-2 text-white/85">
                <Sparkles className="size-4" />
                <span>Abonné depuis :</span>
                <strong className="text-white">
                  {formatDateFr(sub.startedAt)}
                </strong>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            <Button
              asChild
              className="bg-amber-400 text-kaza-navy hover:bg-amber-400/90"
            >
              <Link href="/pricing">
                <TrendingUp className="mr-2 size-4" />
                Modifier mon plan
              </Link>
            </Button>
            <CancelSubscriptionButton
              subscriptionId={sub.id}
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            />
          </div>
        </div>
      </section>

      {/* Quotas */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-kaza-navy">
              Utilisation de votre plan
            </h2>
            <p className="text-sm text-muted-foreground">
              Suivez en temps réel votre consommation mensuelle.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuotaCard
            label="Annonces actives"
            used={quotaDisplay.activeListings.used}
            max={quotaDisplay.activeListings.max}
            icon={Building2}
          />
          <QuotaCard
            label="Membres d'équipe"
            used={quotaDisplay.teamMembers.used}
            max={quotaDisplay.teamMembers.max}
            icon={Users}
          />
          <QuotaCard
            label="Boosts ce mois"
            used={quotaDisplay.boostsPerMonth.used}
            max={quotaDisplay.boostsPerMonth.max}
            icon={Rocket}
          />
          <QuotaCard
            label="Stockage"
            used={quotaDisplay.storageGB.used}
            max={quotaDisplay.storageGB.max}
            unit="GB"
            icon={HardDrive}
          />
        </div>
      </section>

      {/* Fonctionnalités incluses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-kaza-green" />
            Fonctionnalités incluses dans {planDetails?.name ?? sub.plan}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {(planDetails?.features ?? []).map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-kaza-green/15 text-kaza-green">
                  <Check className="size-4" />
                </span>
                <span className="text-sm text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Historique des factures */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-kaza-blue" />
              Historique des factures
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {invoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Receipt className="mx-auto size-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucune facture pour l&apos;instant.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° facture</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Moyen de paiement</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-xs font-semibold text-kaza-navy">
                          {invoice.number}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateFr(invoice.issuedAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {invoice.description ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-kaza-navy">
                          {formatFcfa(invoice.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              INVOICE_STATUS_BADGE[invoice.status] ??
                              "bg-slate-100 text-slate-700"
                            }
                          >
                            {INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {invoice.paymentMethod ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-kaza-blue hover:text-kaza-blue"
                              disabled={!invoice.pdfUrl}
                              asChild={Boolean(invoice.pdfUrl)}
                            >
                              {invoice.pdfUrl ? (
                                <a
                                  href={invoice.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Download className="size-3.5" />
                                  PDF
                                </a>
                              ) : (
                                <>
                                  <Download className="size-3.5" />
                                  PDF
                                </>
                              )}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 gap-1">
                              <Eye className="size-3.5" />
                              Voir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-3">
                <p className="text-sm text-muted-foreground">
                  {invoices.length} facture{invoices.length > 1 ? "s" : ""}
                </p>
                <p className="text-sm font-medium text-kaza-navy">
                  Total facturé {currentYear} :{" "}
                  <span className="font-heading text-base font-bold">
                    {formatFcfa(totalYTD)}
                  </span>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Comparateur de plans */}
      <section>
        <div className="mb-4">
          <h2 className="font-heading text-xl font-bold text-kaza-navy">
            Comparez nos plans
          </h2>
          <p className="text-sm text-muted-foreground">
            Évoluez à votre rythme. Changement immédiat, sans frais.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {AGENCY_PLAN_KEYS.map((planKey) => {
            const plan = PLAN_DETAILS[planKey];
            const isCurrent = planKey === sub.plan;
            const isPremium = planKey === "PRO_PREMIUM";
            const isElite = planKey === "PRO_ELITE";
            return (
              <Card
                key={planKey}
                className={
                  isCurrent
                    ? "relative border-2 border-kaza-blue shadow-lg"
                    : "relative border-border/70"
                }
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-kaza-blue text-white hover:bg-kaza-blue">
                      Votre plan
                    </Badge>
                  </div>
                )}
                {!isCurrent && isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-400 text-kaza-navy hover:bg-amber-400">
                      + populaire
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-lg text-kaza-navy">
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline gap-1">
                    <p className="font-heading text-3xl font-bold text-kaza-navy">
                      {formatFcfa(plan.priceMonthly)}
                    </p>
                    <span className="text-sm text-muted-foreground">/ mois</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-kaza-green" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <SubscribeButton
                    plan={planKey}
                    label={isCurrent ? "Plan actuel" : `Passer à ${plan.name.replace(/^KAZA Pro /, "")}`}
                    isAuthenticated
                    isCurrentPlan={isCurrent}
                    signupRoleSuffix="&role=agency"
                    className={
                      isElite && !isCurrent
                        ? "w-full bg-kaza-navy text-white hover:bg-kaza-navy/90"
                        : "w-full"
                    }
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Méthodes de paiement + Adresse facturation (display only — MVP) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-kaza-blue" />
              Moyens de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-kaza-blue/30 bg-kaza-blue/5 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-kaza-navy text-white">
                  <CreditCard className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-kaza-navy">
                    {sub.paymentMethod ?? "Carte bancaire"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Moyen actif sur l&apos;abonnement
                  </p>
                </div>
              </div>
              <Badge className="bg-kaza-blue text-white hover:bg-kaza-blue">
                Par défaut
              </Badge>
            </div>
            <Button variant="outline" className="w-full" disabled>
              + Ajouter un moyen de paiement (bientôt)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-kaza-blue" />
                Adresse de facturation
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link href="/agency/settings">
                  <Pencil className="size-3.5" />
                  Modifier
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Raison sociale
              </p>
              <p className="font-semibold text-kaza-navy">
                {AGENCY_PROFILE.legalName}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  RCCM
                </p>
                <p className="font-mono text-sm text-foreground">
                  {AGENCY_PROFILE.rccm}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  IFU
                </p>
                <p className="font-mono text-sm text-foreground">
                  {AGENCY_PROFILE.ifu}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Email facturation
              </p>
              <p className="text-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerte usage si > 80% */}
      {quotaDisplay.activeListings.used / quotaDisplay.activeListings.max > 0.8 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">
              Vous approchez de votre quota d&apos;annonces actives
            </p>
            <p className="mt-0.5 text-amber-800">
              Anticipez votre croissance — passez à un plan supérieur pour
              davantage de capacité.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex flex-col items-center gap-2 border-t border-border pt-6 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <HelpCircle className="size-4" />
          Une question facturation ?{" "}
          <a
            href="mailto:contact@kaza.africa"
            className="font-medium text-kaza-blue hover:underline"
          >
            contact@kaza.africa
          </a>
        </p>
        <Link
          href="/legal/cgu"
          className="text-xs text-muted-foreground hover:text-kaza-blue hover:underline"
        >
          Voir nos CGV
        </Link>
      </footer>
    </div>
  );
}
