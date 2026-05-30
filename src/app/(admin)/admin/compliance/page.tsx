import type { Metadata } from "next";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  ShieldCheck,
  XCircle,
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
  getComplianceMetrics,
} from "@/lib/queries/compliance";
import { ComplianceAnalyzeButton } from "./compliance-actions";
import {
  type ComplianceArea,
} from "@/lib/queries/compliance";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conformité réglementaire — KAZA Admin",
  description: "RGPD · APDP · OHADA · ISO · audits & certifications.",
};

// =============================================================================
// Données déclaratives (faits de l'entreprise, pas des métriques calculées)
// =============================================================================

// Certifications & accréditations : déclarations de l'entreprise. Légitime.
const CERTIFICATIONS = [
  { id: "c1", name: "ISO 27001", desc: "Sécurité de l'information", color: "bg-blue-50 text-kaza-blue" },
  { id: "c2", name: "RGPD-ready", desc: "Conformité européenne", color: "bg-emerald-50 text-emerald-600" },
  { id: "c3", name: "APDP Bénin", desc: "Autorité de Protection des Données Personnelles", color: "bg-purple-50 text-purple-600" },
  { id: "c4", name: "OHADA AUDCG", desc: "Acte uniforme commercial", color: "bg-amber-50 text-amber-600" },
  { id: "c5", name: "SOC 2 Type II", desc: "Audit annuel indépendant", color: "bg-cyan-50 text-cyan-600" },
  { id: "c6", name: "PCI DSS", desc: "Conformité paiements", color: "bg-red-50 text-red-600" },
];

// Documents légaux publiés : liens vers les vraies pages du site. Légitime.
const LEGAL_DOCS = [
  { id: "d1", title: "Conditions Générales d'Utilisation", href: "/legal/cgu" },
  { id: "d2", title: "Politique de confidentialité", href: "/legal/confidentialite" },
  { id: "d3", title: "Politique de cookies", href: "/legal/cookies" },
  { id: "d4", title: "Mentions légales", href: "/legal/mentions-legales" },
];

const STATUS_STYLES: Record<
  ComplianceArea["status"],
  { Icon: typeof CheckCircle2; bg: string; text: string; label: string }
> = {
  OK: { Icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", label: "Conforme" },
  WARN: { Icon: AlertTriangle, bg: "bg-amber-50", text: "text-amber-700", label: "À surveiller" },
  FAIL: { Icon: XCircle, bg: "bg-red-50", text: "text-red-700", label: "Non conforme" },
  DOCUMENTED: { Icon: FileText, bg: "bg-blue-50", text: "text-kaza-blue", label: "Documenté" },
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =============================================================================
// PAGE
// =============================================================================
export default async function AdminCompliancePage() {
  const metrics = await getComplianceMetrics();
  const hasScore = metrics.globalScore !== null;
  const score = metrics.globalScore ?? 0;

  // HERO gauge
  const heroR = 80;
  const heroCirc = 2 * Math.PI * heroR;
  const heroDash = (score / 100) * heroCirc;

  const compliant = hasScore && score >= 90;
  const heroBadgeClass = compliant
    ? "bg-emerald-100 text-emerald-700"
    : "bg-amber-100 text-amber-700";
  const heroBadgeLabel = !hasScore
    ? "Données insuffisantes"
    : compliant
      ? "Conforme"
      : "À surveiller";

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/* HEADER                                                              */}
      {/* ================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
            Conformité réglementaire
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            RGPD · APDP Bénin · OHADA · ISO 27001 · SOC 2
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={`border-0 px-3 py-1 text-sm font-semibold hover:bg-transparent ${heroBadgeClass}`}
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" />
            {hasScore ? `Score ${score}/100 — ${heroBadgeLabel}` : heroBadgeLabel}
          </Badge>
          <ComplianceAnalyzeButton areaCount={metrics.areas.length} />
        </div>
      </div>

      {/* ================================================================== */}
      {/* HERO GAUGE                                                          */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm">
        <CardContent className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:gap-10">
          <div className="relative shrink-0">
            <svg viewBox="0 0 200 200" className="h-44 w-44">
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4CAF50" />
                  <stop offset="100%" stopColor="#1976D2" />
                </linearGradient>
              </defs>
              <circle
                r={heroR}
                cx={100}
                cy={100}
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth={16}
              />
              {hasScore && (
                <circle
                  r={heroR}
                  cx={100}
                  cy={100}
                  fill="transparent"
                  stroke="url(#heroGrad)"
                  strokeWidth={16}
                  strokeDasharray={`${heroDash} ${heroCirc - heroDash}`}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-4xl font-bold text-kaza-navy">
                {hasScore ? score : "N/A"}
              </span>
              {hasScore && (
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  / 100
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <Badge
              className={`border-0 hover:bg-transparent ${heroBadgeClass}`}
            >
              {compliant ? (
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              )}
              {heroBadgeLabel}
            </Badge>
            <h2 className="mt-2 font-heading text-xl font-bold text-kaza-navy lg:text-2xl">
              Score de conformité calculé sur des signaux mesurables
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Moyenne pondérée des indicateurs disponibles en base. Détail :{" "}
              {metrics.scoreBreakdown}.
            </p>
            <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
              Les certifications et audits externes sont déclaratifs et ne
              sont pas comptés dans ce score.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* GRID PAR AREA                                                       */}
      {/* ================================================================== */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-bold text-kaza-navy">
          Détail par domaine de conformité
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.areas.map((area) => {
            const status = STATUS_STYLES[area.status];
            const StatusIcon = status.Icon;
            const hasAreaScore = area.score !== null;
            const areaScore = area.score ?? 0;
            const r = 22;
            const c = 2 * Math.PI * r;
            const dash = (areaScore / 100) * c;
            const ringColor =
              areaScore >= 90 ? "#4CAF50" : areaScore >= 75 ? "#F59E0B" : "#EF4444";
            return (
              <Card
                key={area.area}
                className="rounded-2xl border-gray-200/80 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold leading-tight text-kaza-navy">
                      {area.area}
                    </h3>
                    <div className="relative shrink-0">
                      <svg viewBox="0 0 60 60" className="h-14 w-14">
                        <circle
                          r={r}
                          cx={30}
                          cy={30}
                          fill="transparent"
                          stroke="#F1F5F9"
                          strokeWidth={6}
                        />
                        {hasAreaScore && (
                          <circle
                            r={r}
                            cx={30}
                            cy={30}
                            fill="transparent"
                            stroke={ringColor}
                            strokeWidth={6}
                            strokeDasharray={`${dash} ${c - dash}`}
                            strokeLinecap="round"
                            transform="rotate(-90 30 30)"
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {hasAreaScore ? (
                          <span
                            className="text-xs font-bold"
                            style={{ color: ringColor }}
                          >
                            {areaScore}
                          </span>
                        ) : (
                          <HelpCircle className="h-4 w-4 text-gray-300" />
                        )}
                      </div>
                    </div>
                  </div>
                  {hasAreaScore && (
                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${areaScore}%`,
                            backgroundColor: ringColor,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <Badge
                    className={`mt-3 border-0 ${status.bg} ${status.text} hover:bg-transparent`}
                  >
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>
                  <ul className="mt-3 space-y-1.5">
                    {area.actions.map((a, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-xs leading-relaxed text-gray-600"
                      >
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* TÂCHES PENDING — pas de table dédiée, empty state honnête           */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Tâches de conformité à venir
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Suivi des échéances réglementaires
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <CheckCircle2 className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-kaza-navy">
              Aucune tâche de conformité planifiée
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              Aucune table de suivi des tâches de conformité n&apos;est encore
              en place. Les échéances apparaîtront ici une fois le module activé.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* CERTIFICATIONS                                                      */}
      {/* ================================================================== */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-bold text-kaza-navy">
          Certifications & accréditations
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CERTIFICATIONS.map((c) => (
            <Card key={c.id} className="rounded-2xl border-gray-200/80 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
                  <Award className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold text-kaza-navy">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* DOCUMENTS LÉGAUX                                                    */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Documents légaux & politiques
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {LEGAL_DOCS.length} documents · publiés sur le site
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-gray-100">
            {LEGAL_DOCS.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-gray-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-kaza-blue">
                    <FileText className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-kaza-navy">{d.title}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 px-3 text-xs">
                  <a href={d.href} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Consulter
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* DÉLAIS LÉGAUX                                                       */}
      {/* ================================================================== */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-bold text-kaza-navy">
          Délais légaux à respecter
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "RGPD — Réponse demande",
              value: "30 jours",
              detail: "À compter de la réception (Art. 12 RGPD)",
              color: "text-kaza-blue",
              bg: "bg-blue-50",
            },
            {
              label: "Conservation données",
              value: "5 ans",
              detail: "Après dernière interaction utilisateur",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Conservation contrats",
              value: "10 ans",
              detail: "Loi Bénin 2018-12 · acte OHADA",
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Notification incident",
              value: "72 heures",
              detail: "Violation données → CNIL/APDP",
              color: "text-red-600",
              bg: "bg-red-50",
            },
          ].map((d) => (
            <Card key={d.label} className="rounded-2xl border-gray-200/80 shadow-sm">
              <CardContent className="p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${d.bg}`}>
                  <Clock className={`h-5 w-5 ${d.color}`} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                  {d.label}
                </p>
                <p className={`mt-1 font-heading text-2xl font-bold ${d.color}`}>
                  {d.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{d.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* DEMANDES RGPD                                                       */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Demandes RGPD en cours
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {metrics.gdprRequests.length} demande(s) de suppression active(s) ·
              délai légal 30 jours
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/admin/users">Voir les utilisateurs</a>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 sm:grid-cols-1">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-amber-700">
                Suppressions de compte demandées
              </p>
              <p className="font-heading text-2xl font-bold text-amber-700">
                {metrics.gdprRequests.length}
              </p>
            </div>
          </div>

          {metrics.gdprRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <ShieldCheck className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-kaza-navy">
                Aucune demande RGPD en attente
              </p>
              <p className="max-w-md text-xs text-muted-foreground">
                Les demandes de suppression de compte soumises par les
                utilisateurs apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-gray-200 bg-gray-50/70 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Utilisateur</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Demandée le</th>
                    <th className="px-4 py-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.gdprRequests.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-medium text-kaza-navy">
                        {r.user}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {r.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        Suppression de compte
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {formatDate(r.requestedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
                          En attente
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
