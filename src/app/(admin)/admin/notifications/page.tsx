import type { Metadata } from "next";
import {
  BellRing,
  Inbox,
  Mail,
  Send,
  Smartphone,
  Target,
  Users2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatNumber } from "@/lib/utils";
import { getAudienceSegments, listCampaigns } from "@/lib/queries/campaigns";
import { CampaignComposer } from "./campaign-composer";

export const metadata: Metadata = {
  title: "Notifications & campagnes — Kaabo Admin",
  description: "Pilotage des envois email/push/in-app et segmentation réelle.",
};

export const dynamic = "force-dynamic";

const CHANNEL_CONFIG: Record<
  string,
  { Icon: typeof Mail; color: string; bg: string; label: string }
> = {
  IN_APP: { Icon: BellRing, color: "text-kaza-navy", bg: "bg-slate-100", label: "In-App" },
  EMAIL: { Icon: Mail, color: "text-kaza-blue", bg: "bg-blue-50", label: "Email" },
  PUSH: { Icon: BellRing, color: "text-purple-600", bg: "bg-purple-50", label: "Push" },
  SMS: { Icon: Smartphone, color: "text-emerald-600", bg: "bg-emerald-50", label: "SMS" },
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENDING: "bg-amber-100 text-amber-700",
  SENT: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENDING: "Envoi…",
  SENT: "Envoyée",
  FAILED: "Échec",
};

const SEGMENT_GRADIENTS = [
  "from-kaza-navy to-kaza-blue",
  "from-kaza-blue to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-purple-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-slate-400 to-slate-600",
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "il y a < 1h";
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

export default async function AdminNotificationsPage() {
  const [segments, campaigns] = await Promise.all([
    getAudienceSegments(),
    listCampaigns(20),
  ]);

  const totalSent = campaigns
    .filter((c) => c.status === "SENT")
    .reduce((s, c) => s + c.sentCount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Notifications & campagnes
        </h1>
        <p className="text-sm text-muted-foreground">
          Envoyez des messages ciblés à vos utilisateurs · segments calculés en temps réel
        </p>
      </div>

      {/* KPIs réels */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50">
              <Users2 className="size-5 text-kaza-blue" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Audience totale
              </p>
              <p className="font-heading text-2xl font-bold text-kaza-navy">
                {formatNumber(segments.find((s) => s.key === "ALL")?.count ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50">
              <Send className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Messages envoyés
              </p>
              <p className="font-heading text-2xl font-bold text-kaza-navy">
                {formatNumber(totalSent)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50">
              <Target className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Campagnes
              </p>
              <p className="font-heading text-2xl font-bold text-kaza-navy">
                {formatNumber(campaigns.length)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Composer fonctionnel */}
      <CampaignComposer segments={segments} />

      {/* Segments d'audience RÉELS */}
      <section>
        <div className="mb-4">
          <h2 className="font-heading text-lg font-semibold text-kaza-navy">
            Segments d&apos;audience
          </h2>
          <p className="text-xs text-muted-foreground">
            {segments.length} segments · comptes calculés en direct depuis la base
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((s, i) => (
            <div
              key={s.key}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${
                SEGMENT_GRADIENTS[i % SEGMENT_GRADIENTS.length]
              } p-5 text-white shadow-sm`}
            >
              <Target className="absolute right-3 top-3 size-5 text-white/40" />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                Segment
              </p>
              <p className="mt-2 font-heading text-3xl font-bold">
                {formatNumber(s.count)}
              </p>
              <p className="mt-1 text-sm text-white/80">{s.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Historique campagnes */}
      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold text-kaza-navy">
          Historique des campagnes
        </h2>
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Campagnes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Inbox className="size-9 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Aucune campagne envoyée pour le moment
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Composez votre première campagne ci-dessus. Elle apparaîtra ici
                  avec le nombre réel de destinataires touchés.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {campaigns.map((c) => {
                  const cfg = CHANNEL_CONFIG[c.channel] ?? CHANNEL_CONFIG.IN_APP;
                  const Icon = cfg.Icon;
                  return (
                    <li key={c.id} className="flex items-center gap-3 py-3">
                      <div className={`flex size-9 items-center justify-center rounded-lg ${cfg.bg}`}>
                        <Icon className={`size-4 ${cfg.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-kaza-navy">
                          {c.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {cfg.label} · {c.segment} · {c.sentCount}/{c.audienceSize} envoyés
                          {c.sentAt ? ` · ${timeAgo(c.sentAt)}` : ""}
                        </p>
                      </div>
                      <Badge className={STATUS_STYLES[c.status] ?? "bg-slate-100 text-slate-700"}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
