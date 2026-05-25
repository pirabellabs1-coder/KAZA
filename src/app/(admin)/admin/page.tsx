import Link from "next/link";
import {
  Users,
  Building2,
  Wallet,
  AlertOctagon,
  UserPlus,
  Home,
  CreditCard,
  CheckCircle2,
  ShieldAlert,
  MessageSquare,
  Star,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatsGrid } from "@/components/admin/stats-grid";
import { StatusBadge, type StatusType } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatPrice, getInitials } from "@/lib/utils";

// === Mocked data ===

const activityFeed = [
  {
    id: 1,
    icon: UserPlus,
    iconBg: "bg-blue-100 text-blue-600",
    title: "Nouvelle inscription",
    description: "Aminata Sow s'est inscrite comme locataire",
    time: "Il y a 5 min",
  },
  {
    id: 2,
    icon: Home,
    iconBg: "bg-green-100 text-green-600",
    title: "Annonce publiée",
    description: "Villa 3 chambres à Cotonou - Akpakpa",
    time: "Il y a 18 min",
  },
  {
    id: 3,
    icon: CreditCard,
    iconBg: "bg-emerald-100 text-emerald-600",
    title: "Paiement reçu",
    description: "Loyer Mai 2026 - 180 000 FCFA via FedaPay",
    time: "Il y a 42 min",
  },
  {
    id: 4,
    icon: ShieldAlert,
    iconBg: "bg-orange-100 text-orange-600",
    title: "Litige ouvert",
    description: "Problème de caution - dossier #L-2103",
    time: "Il y a 1 h",
  },
  {
    id: 5,
    icon: CheckCircle2,
    iconBg: "bg-green-100 text-green-600",
    title: "Identité vérifiée",
    description: "KYC approuvé pour Moussa Adékambi",
    time: "Il y a 2 h",
  },
  {
    id: 6,
    icon: Star,
    iconBg: "bg-amber-100 text-amber-600",
    title: "Nouvel avis",
    description: "5 étoiles laissées sur l'annonce #A-1542",
    time: "Il y a 3 h",
  },
  {
    id: 7,
    icon: MessageSquare,
    iconBg: "bg-blue-100 text-blue-600",
    title: "Signalement",
    description: "Comportement inapproprié signalé sur le chat",
    time: "Il y a 4 h",
  },
  {
    id: 8,
    icon: XCircle,
    iconBg: "bg-red-100 text-red-600",
    title: "Annonce rejetée",
    description: "Photos non conformes - #A-1538",
    time: "Il y a 5 h",
  },
];

const pendingProperties = [
  {
    id: "A-1547",
    title: "Studio meublé - Fidjrossè",
    owner: "Pierre Hounsou",
    city: "Cotonou",
    price: 95000,
    status: "pending" as StatusType,
  },
  {
    id: "A-1546",
    title: "Villa familiale 4 chambres",
    owner: "Mariam Bio",
    city: "Porto-Novo",
    price: 320000,
    status: "pending" as StatusType,
  },
  {
    id: "A-1545",
    title: "Appartement F3 Cadjèhoun",
    owner: "Jean Sossa",
    city: "Cotonou",
    price: 180000,
    status: "pending" as StatusType,
  },
  {
    id: "A-1544",
    title: "Chambre étudiante Abomey-Calavi",
    owner: "Fatima Adjovi",
    city: "Abomey-Calavi",
    price: 45000,
    status: "pending" as StatusType,
  },
  {
    id: "A-1543",
    title: "Maison de plain-pied avec jardin",
    owner: "Eric Tchégoun",
    city: "Parakou",
    price: 150000,
    status: "pending" as StatusType,
  },
];

const today = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Vue d&apos;ensemble
        </h1>
        <p className="text-sm capitalize text-muted-foreground">{today}</p>
      </div>

      {/* Stats */}
      <StatsGrid cols={4}>
        <StatsCard
          title="Total utilisateurs"
          value="12 450"
          icon={Users}
          trend={{ label: "+12% vs mois dernier", type: "positive" }}
        />
        <StatsCard
          title="Annonces actives"
          value="3 820"
          icon={Building2}
          trend={{ label: "+5% vs mois dernier", type: "positive" }}
        />
        <StatsCard
          title="Revenus 30j"
          value={formatPrice(45200000)}
          icon={Wallet}
          trend={{ label: "+18% vs mois dernier", type: "positive" }}
        />
        <StatsCard
          title="Litiges ouverts"
          value="14"
          icon={AlertOctagon}
          trend={{ label: "-2% vs mois dernier", type: "positive" }}
        />
      </StatsGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity feed */}
        <section className="rounded-xl border border-border bg-card lg:col-span-1">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">
              Activité récente
            </h2>
            <p className="text-xs text-muted-foreground">
              8 derniers événements
            </p>
          </div>
          <ol className="divide-y divide-border">
            {activityFeed.map((event) => {
              const Icon = event.icon;
              return (
                <li
                  key={event.id}
                  className="flex items-start gap-3 px-5 py-3.5"
                >
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${event.iconBg}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-sm font-medium text-foreground">
                      {event.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.description}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                      {event.time}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Pending properties */}
        <section className="overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Annonces à modérer
              </h2>
              <p className="text-xs text-muted-foreground">
                Aperçu de la file d&apos;attente
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/properties" className="gap-1">
                Voir tout
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Annonce
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Propriétaire
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Prix
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingProperties.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {p.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.city} · #{p.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-kaza-navy/10 text-[10px] text-kaza-navy">
                            {getInitials(
                              p.owner.split(" ")[0],
                              p.owner.split(" ")[1] ?? ""
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">
                          {p.owner}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
