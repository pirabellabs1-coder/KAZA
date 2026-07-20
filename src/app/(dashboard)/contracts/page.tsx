import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Archive,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileEdit,
  FileText,
  Home,
  PlusCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ContractStatusBadge,
  type ContractStatus,
} from "@/components/contracts/contract-status-badge";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listUserContracts } from "@/lib/queries/contracts";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mes Contrats",
};

export const dynamic = "force-dynamic";

const TABS: { value: string; label: string; statuses: ContractStatus[] | "ALL" }[] =
  [
    { value: "all", label: "Tous", statuses: "ALL" },
    { value: "drafts", label: "Brouillons", statuses: ["DRAFT"] },
    {
      value: "pending",
      label: "En attente",
      statuses: ["PENDING_TENANT", "PENDING_OWNER"],
    },
    { value: "active", label: "Actifs", statuses: ["SIGNED"] },
    { value: "archived", label: "Archivés", statuses: ["CANCELLED"] },
  ];

export default async function ContractsListPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/contracts");

  const params = await searchParams;
  const activeTab = params.tab || "all";
  const tabConfig = TABS.find((t) => t.value === activeTab) ?? TABS[0];

  const all = await listUserContracts(user.id);
  const list =
    tabConfig.statuses === "ALL"
      ? all
      : all.filter((c) =>
          (tabConfig.statuses as ContractStatus[]).includes(
            c.status as ContractStatus
          )
        );

  // Stats globales
  const stats = {
    total: all.length,
    drafts: all.filter((c) => c.status === "DRAFT").length,
    pending: all.filter(
      (c) => c.status === "PENDING_TENANT" || c.status === "PENDING_OWNER"
    ).length,
    active: all.filter((c) => c.status === "SIGNED").length,
    archived: all.filter((c) => c.status === "CANCELLED").length,
  };

  const canCreate =
    user.role === "OWNER" ||
    user.role === "AGENCY" ||
    user.role === "ADMIN";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Mes Contrats
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez, rédigez et faites signer tous vos baux Kaabo en un seul endroit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/contracts/templates">
              <BookOpen className="mr-1.5 size-4" />
              Voir les modèles
            </Link>
          </Button>
          {canCreate && (
            <Button
              size="lg"
              className="bg-kaza-navy hover:bg-kaza-navy/90"
              asChild
            >
              <Link href="/contracts/new">
                <PlusCircle className="mr-2 size-4" />
                Créer un contrat
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard
          icon={FileText}
          label="Total contrats"
          value={stats.total}
          tone="navy"
        />
        <StatCard
          icon={FileEdit}
          label="Brouillons"
          value={stats.drafts}
          tone="gray"
        />
        <StatCard
          icon={Clock}
          label="En attente"
          value={stats.pending}
          tone="orange"
        />
        <StatCard
          icon={CheckCircle2}
          label="Actifs"
          value={stats.active}
          tone="green"
        />
        <StatCard
          icon={Archive}
          label="Archivés"
          value={stats.archived}
          tone="muted"
        />
      </div>

      {/* Tabs filtre */}
      <Tabs value={activeTab} className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          {TABS.map((tab) => {
            const count =
              tab.statuses === "ALL"
                ? all.length
                : all.filter((c) =>
                    (tab.statuses as ContractStatus[]).includes(
                      c.status as ContractStatus
                    )
                  ).length;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                asChild
                className="data-[state=active]:bg-white data-[state=active]:text-kaza-navy"
              >
                <Link
                  href={`/contracts?tab=${tab.value}`}
                  className="flex items-center gap-1.5"
                >
                  {tab.label}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {count}
                  </span>
                </Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Liste */}
      {list.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={FileText}
            title="Aucun contrat dans cette catégorie"
            description={
              canCreate
                ? "Créez votre premier contrat à partir de l'un de nos modèles juridiques certifiés."
                : "Lorsqu'une location sera confirmée, le contrat correspondant apparaîtra ici."
            }
          />
          {canCreate && (
            <div className="flex justify-center">
              <Button asChild className="bg-kaza-navy hover:bg-kaza-navy/90">
                <Link href="/contracts/new">
                  <PlusCircle className="mr-2 size-4" />
                  Créer un contrat
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Card key={c.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">
                      Contrat #{c.id.slice(-6).toUpperCase()}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-1">
                      {c.propertyTitle}
                    </CardDescription>
                  </div>
                  <ContractStatusBadge status={c.status as ContractStatus} />
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Home className="mt-0.5 size-4 shrink-0 text-kaza-blue" />
                  <span className="line-clamp-2">{c.propertyAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 shrink-0 text-kaza-blue" />
                  <span>
                    Créé le{" "}
                    {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="size-4 shrink-0 text-kaza-blue" />
                  <span className="font-medium text-foreground">
                    {formatPrice(c.monthlyRent)} / mois
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground/70">
                    Propriétaire :
                  </span>
                  <span className="font-medium text-foreground">
                    {c.ownerName}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="w-full" variant="default">
                  <Link href={`/contracts/${c.id}`}>Voir</Link>
                </Button>
                {c.status === "DRAFT" && canCreate && (
                  <Button
                    asChild
                    className="w-full"
                    variant="outline"
                  >
                    <Link href={`/contracts/${c.id}/edit`}>
                      <FileEdit className="mr-1.5 size-4" />
                      Modifier
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  tone: "navy" | "green" | "orange" | "gray" | "muted";
}) {
  const tones: Record<typeof tone, string> = {
    navy: "bg-kaza-navy/10 text-kaza-navy",
    green: "bg-kaza-green/10 text-kaza-green",
    orange: "bg-orange-100 text-orange-700",
    gray: "bg-gray-100 text-gray-700",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
