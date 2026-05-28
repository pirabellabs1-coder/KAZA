import type { Metadata } from "next";
import {
  BellRing,
  Calendar,
  Copy,
  Edit3,
  Eye,
  FileText,
  Mail,
  MessageSquare,
  MousePointer,
  Plus,
  Send,
  Smartphone,
  Sparkles,
  Target,
  Users2,
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
  CAMPAIGNS,
  type Campaign,
  formatNumber,
} from "@/lib/mock/admin-platform-data";

export const metadata: Metadata = {
  title: "Notifications & campagnes — KAZA Admin",
  description: "Pilotage des envois mass email/push/SMS et segmentation.",
};

// =============================================================================
// Helpers
// =============================================================================
const CHANNEL_CONFIG: Record<
  Campaign["channel"],
  { Icon: typeof Mail; color: string; bg: string; label: string }
> = {
  EMAIL: { Icon: Mail, color: "text-kaza-blue", bg: "bg-blue-50", label: "Email" },
  PUSH: { Icon: BellRing, color: "text-purple-600", bg: "bg-purple-50", label: "Push" },
  SMS: { Icon: Smartphone, color: "text-emerald-600", bg: "bg-emerald-50", label: "SMS" },
};

const STATUS_STYLES: Record<Campaign["status"], string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  SENDING: "bg-amber-100 text-amber-700",
  SENT: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<Campaign["status"], string> = {
  DRAFT: "Brouillon",
  SCHEDULED: "Planifiée",
  SENDING: "Envoi en cours",
  SENT: "Envoyée",
  CANCELLED: "Annulée",
};

const SEGMENTS = [
  { id: "s1", name: "Tous utilisateurs", count: 28_540, color: "from-kaza-navy to-kaza-blue" },
  { id: "s2", name: "Locataires actifs", count: 14_280, color: "from-kaza-blue to-cyan-500" },
  { id: "s3", name: "Propriétaires Premium", count: 1_245, color: "from-amber-500 to-orange-500" },
  { id: "s4", name: "Étudiants UAC", count: 3_840, color: "from-purple-500 to-pink-500" },
  { id: "s5", name: "Agences ELITE", count: 24, color: "from-fuchsia-500 to-purple-600" },
  { id: "s6", name: "Inscriptions récentes (7j)", count: 412, color: "from-emerald-500 to-teal-500" },
  { id: "s7", name: "Inactifs (30j+)", count: 5_620, color: "from-slate-400 to-slate-600" },
  { id: "s8", name: "Top spenders", count: 280, color: "from-red-500 to-pink-600" },
];

const TEMPLATES = [
  { id: "t1", name: "Bienvenue", uses: 1_245, color: "bg-emerald-100 text-emerald-700" },
  { id: "t2", name: "Confirmation visite", uses: 842, color: "bg-blue-100 text-blue-700" },
  { id: "t3", name: "Rappel paiement", uses: 487, color: "bg-amber-100 text-amber-700" },
  { id: "t4", name: "Newsletter mensuelle", uses: 12, color: "bg-purple-100 text-purple-700" },
  { id: "t5", name: "Promo / Offre limitée", uses: 8, color: "bg-pink-100 text-pink-700" },
  { id: "t6", name: "Maintenance prévue", uses: 3, color: "bg-slate-200 text-slate-700" },
];

const CHANNEL_PERFORMANCE = [
  {
    channel: "EMAIL",
    label: "Email",
    openRate: 38.4,
    clickRate: 8.2,
    color: "text-kaza-blue",
    bg: "bg-blue-50",
    spark: [32, 35, 38, 36, 40, 39, 38, 41, 38, 39, 40, 38],
    Icon: Mail,
  },
  {
    channel: "PUSH",
    label: "Push",
    openRate: 42.1,
    clickRate: 12.5,
    color: "text-purple-600",
    bg: "bg-purple-50",
    spark: [38, 40, 42, 44, 41, 43, 42, 41, 42, 44, 43, 42],
    Icon: BellRing,
  },
  {
    channel: "SMS",
    label: "SMS",
    openRate: 95,
    clickRate: null,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    spark: [94, 95, 96, 94, 95, 97, 95, 96, 95, 94, 95, 95],
    Icon: Smartphone,
  },
] as const;

// =============================================================================
// Mini Sparkline
// =============================================================================
function MiniSpark({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => `${(i * 100) / (values.length - 1)},${20 - ((v - min) / range) * 18}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-6 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================================
// PAGE
// =============================================================================
export default function AdminNotificationsPage() {
  const sentCampaigns = CAMPAIGNS.filter((c) => c.status === "SENT");
  const activeOrScheduled = CAMPAIGNS.filter(
    (c) => c.status === "SCHEDULED" || c.status === "SENDING"
  );

  const totalReach = sentCampaigns.reduce((s, c) => s + c.audienceSize, 0);
  const avgOpen =
    sentCampaigns.reduce((s, c) => s + (c.openRate ?? 0), 0) / (sentCampaigns.length || 1);
  const avgClick =
    sentCampaigns.reduce((s, c) => s + (c.clickRate ?? 0), 0) / (sentCampaigns.length || 1);

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/* HEADER                                                              */}
      {/* ================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
            Notifications & campagnes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Envois mass email · push · SMS · segmentation & templates
          </p>
        </div>
        <Button className="bg-kaza-blue hover:bg-kaza-blue/90">
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvelle campagne
        </Button>
      </div>

      {/* ================================================================== */}
      {/* KPI ROW                                                             */}
      {/* ================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Campagnes envoyées 30j",
            value: sentCampaigns.length,
            Icon: Send,
            tint: "text-kaza-blue",
            bg: "bg-blue-50",
          },
          {
            label: "Total reach",
            value: formatNumber(totalReach),
            Icon: Users2,
            tint: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Open rate moyen",
            value: `${avgOpen.toFixed(1)}%`,
            Icon: Eye,
            tint: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Click rate moyen",
            value: `${avgClick.toFixed(1)}%`,
            Icon: MousePointer,
            tint: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((k) => {
          const Icon = k.Icon;
          return (
            <Card key={k.label} className="rounded-2xl border-gray-200/80 shadow-sm">
              <CardContent className="p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${k.bg}`}>
                  <Icon className={`h-5 w-5 ${k.tint}`} />
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </p>
                <p className="mt-1 font-heading text-3xl font-bold text-kaza-navy">
                  {k.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* CAMPAGNES EN COURS / PLANIFIÉES                                     */}
      {/* ================================================================== */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-bold text-kaza-navy">
          Campagnes en cours & planifiées
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {[...activeOrScheduled, ...CAMPAIGNS.filter((c) => c.status === "DRAFT")]
            .slice(0, 3)
            .map((c) => {
              const ch = CHANNEL_CONFIG[c.channel];
              const ChIcon = ch.Icon;
              return (
                <Card
                  key={c.id}
                  className="rounded-2xl border-gray-200/80 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${ch.bg}`}>
                        <ChIcon className={`h-5 w-5 ${ch.color}`} />
                      </div>
                      <Badge
                        className={`border-0 ${STATUS_STYLES[c.status]} hover:bg-transparent`}
                      >
                        {STATUS_LABELS[c.status]}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-heading text-base font-bold text-kaza-navy">
                      {c.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">{c.audience}</p>
                    <p className="mt-2 text-sm">
                      <span className="font-semibold text-kaza-navy">
                        {formatNumber(c.audienceSize)}
                      </span>{" "}
                      <span className="text-muted-foreground">destinataires</span>
                    </p>
                    {c.scheduledAt && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-blue-700">
                        <Calendar className="h-3.5 w-3.5" />
                        Envoi {new Date(c.scheduledAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="h-8 flex-1 text-xs">
                        <Edit3 className="mr-1 h-3 w-3" />
                        Modifier
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 flex-1 text-xs">
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* TABLE HISTORIQUE                                                    */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Historique des campagnes
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {CAMPAIGNS.length} campagnes (envoyées + planifiées + brouillons)
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Nom</th>
                  <th className="px-6 py-3 font-semibold">Canal</th>
                  <th className="px-6 py-3 font-semibold">Statut</th>
                  <th className="px-6 py-3 font-semibold">Audience</th>
                  <th className="px-6 py-3 font-semibold">Date envoi</th>
                  <th className="px-6 py-3 font-semibold">Open rate</th>
                  <th className="px-6 py-3 text-right font-semibold">Click rate</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {CAMPAIGNS.map((c) => {
                  const ch = CHANNEL_CONFIG[c.channel];
                  const ChIcon = ch.Icon;
                  const dateToShow = c.sentAt ?? c.scheduledAt;
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4 font-semibold text-kaza-navy">{c.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5">
                          <ChIcon className={`h-3.5 w-3.5 ${ch.color}`} />
                          <span className="text-sm text-gray-700">{ch.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={`border-0 ${STATUS_STYLES[c.status]} hover:bg-transparent`}
                        >
                          {STATUS_LABELS[c.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-700">{c.audience}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(c.audienceSize)} dest.
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {dateToShow
                          ? new Date(dateToShow).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {c.openRate !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full bg-kaza-blue"
                                style={{ width: `${Math.min(100, c.openRate)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-kaza-navy">
                              {c.openRate}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {c.clickRate !== undefined ? (
                          <span className="text-sm font-semibold text-emerald-600">
                            {c.clickRate}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* PERFORMANCE PAR CANAL                                               */}
      {/* ================================================================== */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-bold text-kaza-navy">
          Performance par canal
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {CHANNEL_PERFORMANCE.map((p) => {
            const Icon = p.Icon;
            const sparkColor =
              p.channel === "EMAIL"
                ? "#1976D2"
                : p.channel === "PUSH"
                  ? "#9333EA"
                  : "#4CAF50";
            return (
              <Card key={p.channel} className="rounded-2xl border-gray-200/80 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${p.bg}`}>
                        <Icon className={`h-5 w-5 ${p.color}`} />
                      </div>
                      <div>
                        <p className="font-heading text-lg font-bold text-kaza-navy">
                          {p.label}
                        </p>
                        <p className="text-xs text-muted-foreground">12 dernières campagnes</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Open
                      </p>
                      <p className={`font-heading text-xl font-bold ${p.color}`}>
                        {p.openRate}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Click
                      </p>
                      <p className={`font-heading text-xl font-bold ${p.color}`}>
                        {p.clickRate !== null ? `${p.clickRate}%` : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3" style={{ color: sparkColor }}>
                    <MiniSpark values={[...p.spark]} color={sparkColor} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* SEGMENTS D'AUDIENCE                                                 */}
      {/* ================================================================== */}
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-kaza-navy">
              Segments d&apos;audience
            </h2>
            <p className="text-sm text-muted-foreground">
              {SEGMENTS.length} segments dynamiques · MAJ en continu
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Créer segment
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SEGMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`group rounded-2xl border border-gray-200 bg-gradient-to-br ${s.color} p-4 text-left text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <Target className="h-5 w-5 opacity-80" />
                <span className="text-[10px] uppercase tracking-wide opacity-70">
                  Segment
                </span>
              </div>
              <p className="mt-3 font-heading text-2xl font-bold">
                {formatNumber(s.count)}
              </p>
              <p className="mt-0.5 text-xs opacity-90">{s.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* TEMPLATES EMAIL                                                     */}
      {/* ================================================================== */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-bold text-kaza-navy">
          Templates email
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <Card key={t.id} className="rounded-2xl border-gray-200/80 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.color}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t.uses}× utilisé
                  </span>
                </div>
                <p className="mt-3 font-heading font-bold text-kaza-navy">{t.name}</p>
                {/* preview placeholder */}
                <div className="mt-3 h-20 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3">
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-3/4 rounded bg-gray-200" />
                    <div className="h-1.5 w-full rounded bg-gray-200" />
                    <div className="h-1.5 w-5/6 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-20 rounded bg-kaza-blue/30" />
                  </div>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full">
                  <Edit3 className="mr-1.5 h-3 w-3" />
                  Éditer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* RGPD & OPT-OUT                                                      */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-purple-200 bg-purple-50/30 shadow-sm">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-kaza-navy">
                RGPD & gestion des opt-out
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Respecter automatiquement les désabonnés (activé) ·{" "}
                <span className="font-semibold text-purple-700">142 désabonnés</span> ce mois.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              role="switch"
              aria-checked={true}
              className="flex h-6 w-11 items-center rounded-full bg-emerald-500 p-0.5"
            >
              <span className="h-5 w-5 translate-x-5 rounded-full bg-white shadow-sm" />
            </div>
            <Button variant="outline" size="sm">
              Voir liste
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* CTA — NOUVELLE CAMPAGNE (form placeholder)                          */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 bg-gradient-to-br from-kaza-navy via-[#1f4663] to-[#0f2638] text-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading flex items-center gap-2 text-xl text-white">
            <Sparkles className="h-5 w-5 text-amber-300" />
            Créer une nouvelle campagne
          </CardTitle>
          <p className="text-sm text-white/70">
            Composez et envoyez en quelques minutes · test possible avant envoi
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-white/60">
                  Nom de la campagne
                </label>
                <input
                  type="text"
                  placeholder="Ex : Offre boost été 2026"
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-white/60">
                    Canal
                  </label>
                  <select className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none">
                    <option className="text-gray-900">Email</option>
                    <option className="text-gray-900">Push</option>
                    <option className="text-gray-900">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-white/60">
                    Audience
                  </label>
                  <select className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none">
                    {SEGMENTS.map((s) => (
                      <option key={s.id} className="text-gray-900">
                        {s.name} ({formatNumber(s.count)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-white/60">
                  Date d&apos;envoi
                </label>
                <input
                  type="text"
                  placeholder="Immédiat ou JJ/MM/AAAA HH:MM"
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-white/60">
                  Contenu
                </label>
                <textarea
                  rows={6}
                  placeholder="Tapez votre message ici. Variables disponibles : {{firstName}}, {{lastName}}, {{city}}…"
                  className="mt-1 w-full resize-none rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  Envoyer un test à moi
                </Button>
                <Button size="sm" className="bg-amber-400 text-kaza-navy hover:bg-amber-300">
                  <Send className="mr-1.5 h-4 w-4" />
                  Programmer l&apos;envoi
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
