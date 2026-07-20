import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Gift,
  Mail,
  Share2,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatsCard } from "@/components/dashboard/stats-card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getReferralStats,
  listReferralsForUser,
} from "@/lib/queries/referrals";

import { ReferralCodeCard } from "./referral-code-card";

export const metadata: Metadata = {
  title: "Parrainage",
  description:
    "Invitez vos proches sur Kaabo et gagnez des points pour chaque filleul valide.",
};

const REFERRAL_REWARD_POINTS = 1000;

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Partagez votre code",
    description:
      "Envoyez votre code personnel a vos proches par email, SMS ou reseaux sociaux.",
    icon: Share2,
  },
  {
    step: 2,
    title: "Votre filleul s'inscrit",
    description:
      "Il cree son compte Kaabo en saisissant votre code lors de l'inscription.",
    icon: UserPlus,
  },
  {
    step: 3,
    title: "Vous gagnez 1 000 points",
    description:
      "Des sa premiere location signee, vous recevez 1 000 Kaabo Points dans votre cagnotte.",
    icon: Gift,
  },
];

const TERMS = [
  "Le programme est reserve aux utilisateurs verifies (identite confirmee).",
  "Le code parrainage est personnel et non transferable.",
  "Les 1 000 points sont credites apres signature et premier paiement de la location.",
  "Maximum 50 filleuls valides par annee civile par compte.",
  "Kaabo se reserve le droit de suspendre les comptes en cas d'abus avere.",
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  COMPLETED: "Valide",
  EXPIRED: "Expire",
  CANCELLED: "Annule",
};

const STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-kaza-green/10 text-kaza-green",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-50 text-red-700",
};

function avatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1A3A52&color=ffffff&size=128&rounded=true&bold=true`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ReferralPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?redirect=/referral");
  }

  const [stats, referrals] = await Promise.all([
    getReferralStats(user.id),
    listReferralsForUser(user.id),
  ]);

  return (
    <div className="space-y-8">
      {/* ----------------------------- HERO ----------------------------- */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-kaza-navy via-kaza-navy to-kaza-blue p-8 text-white shadow-lg sm:p-10">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 size-48 rounded-full bg-kaza-green/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-3 border-white/20 bg-white/10 text-white hover:bg-white/15">
              <Sparkles className="mr-1 size-3" />
              Programme Ambassadeur Kaabo
            </Badge>
            <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
              Parrainez et gagnez{" "}
              <span className="bg-gradient-to-r from-kaza-green to-emerald-300 bg-clip-text text-transparent">
                {REFERRAL_REWARD_POINTS} points
              </span>{" "}
              par filleul
            </h1>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              Invitez vos amis, votre famille et vos collegues sur Kaabo. Vous
              gagnez {REFERRAL_REWARD_POINTS} Kaabo Points des leur premiere
              location signee — eux profitent d&apos;un bonus de bienvenue.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <div className="text-sm text-white/70">Cagnotte parrainage</div>
              <div className="mt-1 text-2xl font-bold text-white">
                {stats.pointsEarned.toLocaleString("fr-FR")} pts
              </div>
              <div className="mt-1 text-xs text-white/60">
                Cumul depuis votre inscription
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------- CODE PERSONNEL --------------------- */}
      <ReferralCodeCard
        initialCode={stats.code}
        userFirstName={user.firstName}
      />

      {/* ------------------------- STATS ------------------------- */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Invites"
          value={stats.totalInvited}
          subtitle="Filleuls inscrits avec votre code"
          icon={Mail}
        />
        <StatsCard
          title="Locations completees"
          value={stats.totalConverted}
          subtitle="Filleuls actifs sur Kaabo"
          icon={CheckCircle2}
        />
        <StatsCard
          title="Points gagnes"
          value={stats.pointsEarned}
          subtitle={`${REFERRAL_REWARD_POINTS} pts par filleul valide`}
          icon={Award}
          trend={
            stats.pointsEarned > 0
              ? { label: "+cagnotte", type: "positive" }
              : undefined
          }
        />
      </section>

      {/* ----------------------- MES FILLEULS ----------------------- */}
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
            Mes filleuls
          </h2>
          <span className="text-sm text-muted-foreground">
            {referrals.length} au total
          </span>
        </header>
        {referrals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Aucun filleul pour le moment
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Partagez votre code de parrainage pour commencer a inviter
                vos proches.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {referrals.map((r) => {
              const statusLabel = STATUS_LABELS[r.status] ?? r.status;
              const statusClass =
                STATUS_CLASSES[r.status] ?? "bg-muted text-muted-foreground";
              return (
                <Card
                  key={r.id}
                  className="overflow-hidden transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex items-start gap-4 p-5">
                    <Image
                      src={avatarUrl(r.referredName)}
                      alt={r.referredName}
                      width={48}
                      height={48}
                      className="size-12 shrink-0 rounded-full"
                      unoptimized
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {r.referredName}
                      </p>
                      {r.referredEmail && (
                        <p className="truncate text-xs text-muted-foreground">
                          {r.referredEmail}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                        {r.points > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-kaza-green">
                            <Sparkles className="size-3" />+
                            {r.points.toLocaleString("fr-FR")} pts
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Invite le {formatDate(r.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ----------------------- COMMENT CA MARCHE ----------------------- */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
          Comment ca marche
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }) => (
            <Card key={step} className="relative">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-kaza-blue/10 text-kaza-blue">
                    <Icon className="size-5" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-muted-foreground/30">
                    0{step}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ----------------------- CONDITIONS ----------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conditions du programme</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {TERMS.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-kaza-green" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-5" />
          <p className="text-xs text-muted-foreground">
            En participant au programme, vous acceptez les{" "}
            <a
              href="/legal/cgu"
              className="font-medium text-kaza-blue hover:underline"
            >
              CGU Kaabo
            </a>{" "}
            et la{" "}
            <a
              href="/legal/confidentialite"
              className="font-medium text-kaza-blue hover:underline"
            >
              Politique de confidentialite
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
