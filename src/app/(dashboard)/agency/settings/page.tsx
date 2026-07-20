import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Globe,
  Bell,
  Shield,
  Users,
  ExternalLink,
  Key,
  Webhook,
  Trash2,
  PauseCircle,
  Monitor,
  Pencil,
  Clock,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { AgencySettings } from "@/actions/agency-settings";
import {
  getTeamStats,
  listTeamMembers,
  type AgencyRole,
  type AgencyTeamMember,
} from "@/lib/queries/agency-team";

import { DataExportButton } from "@/components/settings/data-export-button";
import { SettingsProfileForm } from "./settings-profile-form";
import { SettingsPublicForm } from "./settings-public-form";
import { SettingsNotificationsForm } from "./settings-notifications-form";

export const metadata: Metadata = {
  title: "Paramètres agence — Kaabo Pro",
  description:
    "Configurez votre profil agence, votre page publique, vos notifications et vos paramètres de sécurité.",
};

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers / constantes
// ---------------------------------------------------------------------------

// Libellés FR des rôles agence (alignés sur /agency/team).
const ROLE_LABEL: Record<AgencyRole, string> = {
  DIRECTOR: "Directeur·rice",
  MANAGER: "Manager",
  AGENT_SENIOR: "Agent senior",
  AGENT: "Agent",
  INTERN: "Stagiaire",
  ACCOUNTANT: "Comptable",
};

// Couleur de l'avatar dérivée du rôle (pas de couleur arbitraire stockée).
const ROLE_AVATAR_COLOR: Record<AgencyRole, string> = {
  DIRECTOR: "bg-kaza-navy",
  MANAGER: "bg-kaza-blue",
  AGENT_SENIOR: "bg-kaza-blue",
  AGENT: "bg-kaza-green",
  INTERN: "bg-cyan-600",
  ACCOUNTANT: "bg-emerald-600",
};

/** Initiales (max 2 lettres) à partir du nom complet du membre. */
function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join("") || "?"
  );
}

// Évènements de notification connus, avec leurs canaux par défaut.
const DEFAULT_NOTIFICATION_EVENTS: AgencySettings["notifications"]["events"] = {
  new_lead: { email: true, sms: true, push: true },
  visit_confirmed: { email: true, sms: true, push: true },
  signature: { email: true, sms: false, push: true },
  payment_received: { email: true, sms: false, push: true },
  client_review: { email: true, sms: false, push: false },
  weekly_report: { email: true, sms: false, push: false },
  invoice_issued: { email: true, sms: false, push: false },
};

const DEFAULT_AGENCY_SETTINGS: AgencySettings = {
  profile: {
    commercialName: "",
    legalName: "",
    rccm: "",
    ifu: "",
    oapi: "",
    city: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    description: "",
    logoUrl: "",
  },
  public: {
    slug: "",
    accentColor: "navy",
    bannerUrl: "",
    about: "",
    youtube: "",
    social: { facebook: "", instagram: "", linkedin: "", twitter: "" },
    showTeam: true,
    enableReviews: true,
  },
  notifications: {
    events: DEFAULT_NOTIFICATION_EVENTS,
    quietHours: { start: "08:00", end: "20:00", days: [0, 1, 2, 3, 4, 5] },
    digest: "weekly",
  },
};

/**
 * Lit `users.agency_settings` et fusionne avec les valeurs par défaut afin de
 * garantir une forme complète même si la colonne est vide ou partielle.
 */
async function loadAgencySettings(): Promise<AgencySettings> {
  try {
    const user = await getCurrentDisplayUser();
    if (!user) return DEFAULT_AGENCY_SETTINGS;

    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("agency_settings, profile_photo_url")
      .eq("id", user.id)
      .maybeSingle();

    const raw = (data?.agency_settings ?? {}) as Partial<AgencySettings>;
    const savedProfile: Partial<AgencySettings["profile"]> = raw.profile ?? {};

    // Pré-remplissage : si l'agence n'a pas encore rempli son profil, on
    // amorce avec l'identité du compte (nom, email) et la photo de profil
    // existante, pour ne pas afficher un formulaire totalement vide.
    const accountName = `${user.firstName} ${user.lastName}`.trim();

    return {
      profile: {
        ...DEFAULT_AGENCY_SETTINGS.profile,
        commercialName:
          savedProfile.commercialName ||
          DEFAULT_AGENCY_SETTINGS.profile.commercialName ||
          accountName,
        legalName: savedProfile.legalName ?? "",
        rccm: savedProfile.rccm ?? "",
        ifu: savedProfile.ifu ?? "",
        oapi: savedProfile.oapi ?? "",
        city: savedProfile.city ?? "",
        address: savedProfile.address ?? "",
        email: savedProfile.email || user.email || "",
        phone: savedProfile.phone ?? "",
        website: savedProfile.website ?? "",
        description: savedProfile.description ?? "",
        logoUrl: savedProfile.logoUrl || data?.profile_photo_url || "",
      },
      public: { ...DEFAULT_AGENCY_SETTINGS.public, ...(raw.public ?? {}) },
      notifications: {
        ...DEFAULT_AGENCY_SETTINGS.notifications,
        ...(raw.notifications ?? {}),
        events: {
          ...DEFAULT_NOTIFICATION_EVENTS,
          ...(raw.notifications?.events ?? {}),
        },
      },
    };
  } catch {
    return DEFAULT_AGENCY_SETTINGS;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgencySettingsPage() {
  const user = await getCurrentDisplayUser();

  // L'agencyId = l'id du compte AGENCY connecté. Sans session, on rend la page
  // avec les valeurs par défaut et une équipe vide (état-vide gracieux).
  const [settings, teamMembers, teamStats] = await Promise.all([
    loadAgencySettings(),
    user ? listTeamMembers(user.id) : Promise.resolve<AgencyTeamMember[]>([]),
    user
      ? getTeamStats(user.id)
      : Promise.resolve({ total: 0, active: 0, onLeave: 0, invited: 0 }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
          Paramètres agence
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez l&apos;identité, la page publique, les notifications et la sécurité de
          votre agence.
        </p>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="profil" className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap justify-start bg-muted/60 p-1">
          <TabsTrigger value="profil" className="gap-2">
            <Building2 className="size-4" aria-hidden="true" />
            Profil agence
          </TabsTrigger>
          <TabsTrigger value="public" className="gap-2">
            <Globe className="size-4" aria-hidden="true" />
            Page publique
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="size-4" aria-hidden="true" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="size-4" aria-hidden="true" />
            Sécurité &amp; API
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="size-4" aria-hidden="true" />
            Membres &amp; permissions
          </TabsTrigger>
        </TabsList>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* TAB 1 — Profil agence (client component avec auto-save)            */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="profil" className="space-y-6">
          <SettingsProfileForm
            initialProfile={settings.profile}
            publicSettings={settings.public}
            notifications={settings.notifications}
          />
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* TAB 2 — Page publique (branché sur updateAgencySettings)           */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="public" className="space-y-6">
          <SettingsPublicForm
            initialPublic={settings.public}
            profile={settings.profile}
            notifications={settings.notifications}
          />
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* TAB 3 — Notifications (branché sur updateAgencySettings)           */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-6">
          <SettingsNotificationsForm
            initialNotifications={settings.notifications}
            profile={settings.profile}
            publicSettings={settings.public}
          />
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* TAB 4 — Sécurité & API (fonctionnalités à venir, désactivées)      */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Clock className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Bientôt disponible</p>
              <p className="text-amber-800">
                Les clés API, les webhooks et la gestion des sessions sont en
                cours de mise en place. Ces options sont désactivées tant
                qu&apos;elles ne sont pas opérationnelles, afin de ne pas laisser
                croire à un enregistrement. (La double authentification, elle,
                est déjà disponible — voir ci-dessous.)
              </p>
            </div>
          </div>

          {/* 2FA — réelle (TOTP via Supabase MFA), gérée dans /settings/security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5 text-kaza-green" aria-hidden="true" />
                Double authentification (2FA)
                <Badge className="ml-1 bg-kaza-green/10 text-[10px] text-kaza-green">
                  Disponible
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center">
                <p className="text-sm text-muted-foreground">
                  Protégez l&apos;accès à votre espace agence avec une
                  application d&apos;authentification (code à 6 chiffres à chaque
                  connexion).
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings/security">
                    <Shield className="mr-1.5 size-3.5" />
                    Gérer la 2FA
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sessions actives */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="size-5 text-kaza-blue" aria-hidden="true" />
                Sessions actives
                <Badge variant="outline" className="ml-1 text-[10px]">
                  Bientôt
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
                  <Monitor className="size-6 text-kaza-blue" aria-hidden="true" />
                </div>
                <p className="mt-3 font-heading text-base font-semibold text-kaza-navy">
                  Liste des sessions indisponible
                </p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Les appareils connectés à votre compte apparaîtront ici dès que
                  le journal des sessions sera activé.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="size-5 text-kaza-blue" aria-hidden="true" />
                Clés API
                <Badge variant="outline" className="ml-1 text-[10px]">
                  Bientôt
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                <Key className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">
                  Aucune clé API créée
                </p>
                <p className="text-xs text-muted-foreground">
                  L&apos;intégration de Kaabo à vos outils internes sera bientôt
                  disponible.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="size-5 text-kaza-blue" aria-hidden="true" />
                Webhooks
                <Badge variant="outline" className="ml-1 text-[10px]">
                  Bientôt
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                <Webhook className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">
                  0 webhook configuré
                </p>
                <p className="text-xs text-muted-foreground">
                  La réception en temps réel des évènements sera bientôt
                  disponible.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* RGPD — export réel des données au format JSON */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Export RGPD
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                Téléchargez l&apos;ensemble des données de votre compte au format
                JSON (profil, annonces, abonnements, factures, paiements…),
                conformément au RGPD et à l&apos;APDP Bénin.
              </p>
              <DataExportButton />
            </CardContent>
          </Card>

          {/* Zone dangereuse */}
          <Card className="border-2 border-rose-200 opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700">
                <Trash2 className="size-5" aria-hidden="true" />
                Zone dangereuse
                <Badge variant="outline" className="ml-1 text-[10px] text-rose-700">
                  Bientôt
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50/50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-rose-900">
                    Suspendre temporairement l&apos;agence
                  </p>
                  <p className="text-sm text-rose-700">
                    Vos annonces seront cachées du public mais conservées.
                  </p>
                </div>
                <Button
                  variant="outline"
                  disabled
                  className="border-rose-300 text-rose-700"
                >
                  <PauseCircle className="mr-2 size-4" aria-hidden="true" />
                  Suspendre
                </Button>
              </div>
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-rose-900">
                    Supprimer définitivement le compte agence
                  </p>
                  <p className="text-sm text-rose-700">
                    Toutes les données seront effacées. Cette action est irréversible.
                  </p>
                </div>
                <Button disabled className="bg-rose-600 text-white">
                  <Trash2 className="mr-2 size-4" aria-hidden="true" />
                  Supprimer le compte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* TAB 5 — Membres & permissions                                      */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-kaza-blue" aria-hidden="true" />
                Vue d&apos;ensemble équipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-heading text-2xl font-bold text-kaza-navy">
                    {teamStats.active} membre{teamStats.active > 1 ? "s" : ""} actif
                    {teamStats.active > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Gérez votre équipe depuis la page dédiée.
                  </p>
                </div>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/agency/team">
                    Gérer l&apos;équipe
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rôles &amp; permissions</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Permissions actives</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          Aucun membre dans votre équipe pour le moment.{" "}
                          <Link
                            href="/agency/team"
                            className="font-medium text-kaza-blue hover:underline"
                          >
                            Inviter un collaborateur
                          </Link>
                        </TableCell>
                      </TableRow>
                    )}
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white ${ROLE_AVATAR_COLOR[member.role]}`}
                            >
                              {initialsOf(member.fullName)}
                            </div>
                            <span className="font-medium text-foreground">
                              {member.fullName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.email ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-kaza-blue/10 text-kaza-blue hover:bg-kaza-blue/10">
                            {ROLE_LABEL[member.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {member.permissions.slice(0, 3).map((perm) => (
                              <Badge
                                key={perm}
                                variant="outline"
                                className="text-[10px] uppercase"
                              >
                                {perm}
                              </Badge>
                            ))}
                            {member.permissions.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{member.permissions.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm" className="gap-1">
                            <Link href="/agency/team">
                              <Pencil className="size-3.5" aria-hidden="true" />
                              Modifier
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
