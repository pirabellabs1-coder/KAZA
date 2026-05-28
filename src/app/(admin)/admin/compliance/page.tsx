import type { Metadata } from "next";
import {
  AlertTriangle,
  Award,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileText,
  PlayCircle,
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

// Fallbacks vides — à brancher quand tables compliance/gdpr seront en place.
const COMPLIANCE_SCORE = {
  global: 0,
  byArea: [] as Array<{ area: string; score: number; status: string }>,
};
const GDPR_REQUESTS: Array<{
  id: string;
  type: string;
  user: string;
  email: string;
  requestedAt: string;
  status: string;
  daysLeft: number;
}> = [];
const PENDING_COMPLIANCE_TASKS: Array<{
  id: string;
  title: string;
  dueDate: string;
  priority: string;
}> = [];

export const metadata: Metadata = {
  title: "Conformité réglementaire — KAZA Admin",
  description: "RGPD · APDP · OHADA · ISO · audits & certifications.",
};

// =============================================================================
// Données dérivées
// =============================================================================
const CERTIFICATIONS = [
  { id: "c1", name: "ISO 27001", desc: "Sécurité de l'information", expiresAt: "2027-03-15", color: "bg-blue-50 text-kaza-blue" },
  { id: "c2", name: "RGPD-ready", desc: "Conformité européenne", expiresAt: "Permanent", color: "bg-emerald-50 text-emerald-600" },
  { id: "c3", name: "APDP Bénin", desc: "Enregistrement n°2024-145", expiresAt: "2027-01-22", color: "bg-purple-50 text-purple-600" },
  { id: "c4", name: "OHADA AUDCG", desc: "Acte uniforme commercial", expiresAt: "Permanent", color: "bg-amber-50 text-amber-600" },
  { id: "c5", name: "SOC 2 Type II", desc: "Audit annuel indépendant", expiresAt: "2026-11-30", color: "bg-cyan-50 text-cyan-600" },
  { id: "c6", name: "PCI DSS", desc: "Niveau 2 marchand", expiresAt: "2026-09-08", color: "bg-red-50 text-red-600" },
];

const LEGAL_DOCS = [
  { id: "d1", title: "Conditions Générales d'Utilisation", version: "v4.2", updatedAt: "2026-04-12" },
  { id: "d2", title: "Politique de confidentialité", version: "v3.1", updatedAt: "2026-03-28" },
  { id: "d3", title: "Politique de cookies", version: "v2.0", updatedAt: "2026-02-14" },
  { id: "d4", title: "Mentions légales", version: "v1.8", updatedAt: "2026-01-10" },
  { id: "d5", title: "Politique RGPD", version: "v2.4", updatedAt: "2026-04-22" },
  { id: "d6", title: "Charte de modération", version: "v1.5", updatedAt: "2026-02-02" },
  { id: "d7", title: "Conditions Pro & Agences", version: "v2.1", updatedAt: "2026-03-05" },
  { id: "d8", title: "Politique anti-fraude & KYC", version: "v1.3", updatedAt: "2026-04-18" },
];

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-blue-100 text-blue-700",
};

const STATUS_STYLES: Record<string, { Icon: typeof CheckCircle2; bg: string; text: string; label: string }> = {
  OK: { Icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", label: "Conforme" },
  WARN: { Icon: AlertTriangle, bg: "bg-amber-50", text: "text-amber-700", label: "À surveiller" },
  FAIL: { Icon: XCircle, bg: "bg-red-50", text: "text-red-700", label: "Non conforme" },
};

const AREA_ACTIONS: Record<string, string[]> = {
  "Protection données (APDP/RGPD)": [
    "Audit semestriel terminé (mai 2026)",
    "DPO désignée : Marie K.",
  ],
  "Conservation contrats (OHADA)": [
    "Archivage S3 Glacier · 10 ans",
    "Tests restauration trimestriels OK",
  ],
  "KYC utilisateurs": [
    "97% des comptes Pro vérifiés",
    "Process automatisé Onfido + revue manuelle",
  ],
  "Lutte anti-fraude": [
    "ML flagging actif (precision 91%)",
    "3 cas faux positifs ce mois — à réviser",
  ],
  "Transparence tarifaire": [
    "Aucun frais caché signalé",
    "Calcul commission visible sur chaque annonce",
  ],
  "Accessibilité (RGAA)": [
    "Score Lighthouse 78/100",
    "Audit RGAA prévu en juillet — contraste à améliorer",
  ],
  "Sécurité (ISO 27001)": [
    "Pentests trimestriels OK",
    "0 incident critique au T2",
  ],
  "Conditions d'utilisation": [
    "CGU à jour · loi Bénin 2018-12",
    "Notification e-mail des changements opt-in",
  ],
};

const GDPR_TYPE_LABELS: Record<string, string> = {
  EXPORT: "Export de données",
  DELETION: "Suppression de compte",
  RECTIFICATION: "Rectification",
};

const GDPR_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

// =============================================================================
// PAGE
// =============================================================================
export default function AdminCompliancePage() {
  // HERO gauge
  const heroR = 80;
  const heroCirc = 2 * Math.PI * heroR;
  const heroPct = COMPLIANCE_SCORE.global / 100;
  const heroDash = heroPct * heroCirc;

  const gdprPending = GDPR_REQUESTS.filter((r) => r.status !== "COMPLETED").length;
  const gdprExports = GDPR_REQUESTS.filter((r) => r.type === "EXPORT" && r.status !== "COMPLETED").length;
  const gdprDeletions = GDPR_REQUESTS.filter((r) => r.type === "DELETION").length;
  const gdprRectifs = GDPR_REQUESTS.filter((r) => r.type === "RECTIFICATION").length;

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
        <Badge className="border-0 bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
          <ShieldCheck className="mr-1.5 h-4 w-4" />
          Score {COMPLIANCE_SCORE.global}/100 — Conforme
        </Badge>
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
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-4xl font-bold text-kaza-navy">
                {COMPLIANCE_SCORE.global}
              </span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                / 100
              </span>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Conforme
            </Badge>
            <h2 className="mt-2 font-heading text-xl font-bold text-kaza-navy lg:text-2xl">
              KAZA répond aux standards les plus exigeants
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              8 domaines audités · 6 certifications actives · 5 tâches en cours.
              Le prochain audit complet est prévu pour le 30 juin 2026 par
              l&apos;Autorité de Protection des Données Personnelles (APDP) du Bénin.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button className="bg-kaza-navy hover:bg-kaza-navy/90">
                <PlayCircle className="mr-2 h-4 w-4" />
                Lancer audit complet
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Rapport conformité PDF
              </Button>
            </div>
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COMPLIANCE_SCORE.byArea.map((area) => {
            const status = STATUS_STYLES[area.status];
            const StatusIcon = status.Icon;
            const r = 22;
            const c = 2 * Math.PI * r;
            const dash = (area.score / 100) * c;
            const ringColor =
              area.score >= 90 ? "#4CAF50" : area.score >= 75 ? "#F59E0B" : "#EF4444";
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
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="text-xs font-bold"
                          style={{ color: ringColor }}
                        >
                          {area.score}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${area.score}%`,
                          backgroundColor: ringColor,
                        }}
                      />
                    </div>
                  </div>
                  <Badge
                    className={`mt-3 border-0 ${status.bg} ${status.text} hover:bg-transparent`}
                  >
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>
                  <ul className="mt-3 space-y-1.5">
                    {(AREA_ACTIONS[area.area] || []).map((a, i) => (
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
      {/* TÂCHES PENDING                                                      */}
      {/* ================================================================== */}
      <Card className="rounded-2xl border-gray-200/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-kaza-navy">
            Tâches de conformité à venir
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {PENDING_COMPLIANCE_TASKS.length} échéances à traiter
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Tâche</th>
                  <th className="px-6 py-3 font-semibold">Échéance</th>
                  <th className="px-6 py-3 font-semibold">Priorité</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {PENDING_COMPLIANCE_TASKS.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4 font-medium text-kaza-navy">{t.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                        {t.dueDate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`border-0 ${PRIORITY_STYLES[t.priority]} hover:bg-transparent`}
                      >
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                          Marquer fait
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                          Reporter
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  <p className="mt-1 text-xs">
                    <span className="text-muted-foreground">Valable jusqu&apos;à : </span>
                    <span className="font-semibold text-kaza-navy">{c.expiresAt}</span>
                  </p>
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
                  <div>
                    <p className="text-sm font-semibold text-kaza-navy">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{d.version}</span> · MAJ {d.updatedAt}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 px-3 text-xs">
                  <Edit3 className="mr-1 h-3 w-3" />
                  Modifier
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
              detail: "Loi Bénin 2018-12 · archivage S3 Glacier",
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
              {gdprPending} demandes actives · délai légal 30 jours
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/admin/users">Voir page documents</a>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-kaza-blue">
                Exports en cours
              </p>
              <p className="font-heading text-2xl font-bold text-kaza-blue">
                {gdprExports}
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-amber-700">
                Suppressions
              </p>
              <p className="font-heading text-2xl font-bold text-amber-700">
                {gdprDeletions}
              </p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-purple-700">
                Rectifications
              </p>
              <p className="font-heading text-2xl font-bold text-purple-700">
                {gdprRectifs}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-gray-50/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Utilisateur</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Demandée le</th>
                  <th className="px-4 py-3 font-semibold">Deadline</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {GDPR_REQUESTS.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-kaza-navy">
                      {r.userName}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {GDPR_TYPE_LABELS[r.type]}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {r.requestedAt}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">
                      {r.deadline}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`border-0 ${GDPR_STATUS_STYLES[r.status]} hover:bg-transparent`}
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
