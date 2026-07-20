import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  Ban,
  ShieldOff,
  Activity,
  Flag,
  ArrowRight,
} from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";
import { listAllUsers, type AdminUserRow } from "@/lib/queries/admin";
import { listAuditLogs } from "@/lib/queries/audit-logs";
import { countPendingReports } from "@/lib/queries/reports-admin";

import { UsersManager } from "./users-manager";
import type { AdminUser, UserStatus, UserRole, VerificationStatus } from "./types";

// La carte "Comptes signalés" est branchée sur la table `reports` (migration
// 00030) : nombre réel de signalements en attente, avec lien vers
// /admin/reports. Il n'existe volontairement PAS de section "VIPs & Press" :
// aucune table `user_flags` n'est provisionnée, on ne fabrique donc aucune
// donnée fictive ici.

// Map verification_status DB → libellé UI.
const VERIF_MAP: Record<AdminUserRow["verificationStatus"], VerificationStatus> = {
  APPROVED: "VERIFIED",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  UNVERIFIED: "NOT_SUBMITTED",
};

// Adapter Supabase → shape `AdminUser` attendue par UsersManager (UI mock).
// Les champs qui n'existent pas en DB (trustScore, totalSpentFcfa, flag, etc.)
// sont remplis avec des valeurs neutres tant qu'on n'a pas branché l'audit
// log et la facturation.
function toAdminUser(u: AdminUserRow): AdminUser {
  return {
    id: u.id,
    firstName: u.firstName || "Utilisateur",
    lastName: u.lastName || "",
    email: u.email,
    phone: u.phone ?? "",
    role: u.role as UserRole,
    status: (u.isVerified ? "ACTIVE" : "PENDING_KYC") as UserStatus,
    verification: VERIF_MAP[u.verificationStatus],
    signupAt: u.createdAt,
    lastLoginAt: u.updatedAt,
    country: "BJ",
    city: u.address ?? "",
    totalSpentFcfa: 0,
    reportsAgainst: 0,
    trustScore: u.isVerified ? 80 : 50,
    hasTwoFactor: false,
  };
}

export const metadata: Metadata = {
  title: "Gestion des utilisateurs — Admin Kaabo",
  description:
    "Suspendez, bannissez, réactivez et auditez les comptes utilisateurs de la plateforme Kaabo.",
};

// Force dynamic — toujours afficher l'état réel de la base.
export const dynamic = "force-dynamic";


function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-kaza-navy">
            {value}
          </p>
          {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <span
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-xl",
            accent,
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

const ACTION_LABEL: Record<string, string> = {
  USER_SUSPENDED: "a suspendu",
  USER_BANNED: "a banni",
  USER_REACTIVATED: "a réactivé",
  USER_DELETED: "a supprimé",
  USER_ROLE_CHANGED: "a modifié le rôle de",
  USER_IMPERSONATED: "a impersonné",
};

export default async function AdminUsersPage() {
  // Charge tous les utilisateurs depuis Supabase, mapping vers la shape UI.
  const dbUsers = await listAllUsers({ limit: 500 });
  const users: AdminUser[] = dbUsers.map(toAdminUser);

  const total = users.length;
  const active = users.filter((u) => u.status === "ACTIVE").length;
  const pending = dbUsers.filter(
    (u) => u.verificationStatus === "PENDING",
  ).length;
  // Statuts moderation (suspend/ban) pas encore en DB : 0 tant qu'on n'a
  // pas migré users.status → enum dédié.
  const suspended = 0;
  const banned = 0;

  // Audit log réel : actions admin sur des comptes utilisateurs.
  const allLogs = await listAuditLogs({ limit: 50 });
  const userAuditFeed = allLogs
    .filter((l) => l.action.startsWith("USER_"))
    .slice(0, 8);

  // Signalements en attente : compte réel issu de la table `reports`
  // (migration 00030). 0 si la table est vide ou inaccessible.
  const pendingReports = await countPendingReports();

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Gestion des utilisateurs
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatNumber(total)} compte{total > 1 ? "s" : ""} au total
          {pending > 0 ? ` · ${pending} KYC en attente` : ""}
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          icon={Users}
          label="Total"
          value={formatNumber(total)}
          accent="bg-kaza-navy/10 text-kaza-navy"
          hint="comptes plateforme"
        />
        <StatCard
          icon={CheckCircle2}
          label="Actifs"
          value={formatNumber(active)}
          accent="bg-emerald-100 text-emerald-700"
          hint={
            total > 0
              ? `${Math.round((active / total) * 100)}% du parc`
              : "—"
          }
        />
        <StatCard
          icon={Clock}
          label="KYC en attente"
          value={formatNumber(pending)}
          accent="bg-blue-100 text-blue-700"
          hint="à traiter sous 24h"
        />
        <StatCard
          icon={Ban}
          label="Suspendus"
          value={formatNumber(suspended)}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={ShieldOff}
          label="Bannis"
          value={formatNumber(banned)}
          accent="bg-red-100 text-red-700"
        />
      </section>

      {/* Layout 2-col on xl */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Comptes signalés — donnée réelle (table `reports`, migration
              00030). Lien direct vers le back-office de modération.
              Pas de section "VIPs & Press" : aucune table `user_flags`
              n'existe, on ne fabrique aucune donnée fictive. */}
          <Link
            href="/admin/reports"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Flag className="size-5" />
              </span>
              <div>
                <p className="font-heading text-sm font-bold text-kaza-navy">
                  Comptes signalés
                </p>
                <p className="text-xs text-muted-foreground">
                  {pendingReports > 0
                    ? `${formatNumber(pendingReports)} signalement${
                        pendingReports > 1 ? "s" : ""
                      } en attente de traitement`
                    : "Aucun signalement en attente"}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-700">
              Modérer
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          {/* Empty state si la base est vide (premier déploiement). */}
          {total === 0 && (
            <section className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
              <Users className="mx-auto size-10 text-muted-foreground" />
              <h2 className="mt-3 font-heading text-base font-bold text-kaza-navy">
                Aucun utilisateur encore inscrit
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dès la première inscription, les comptes apparaîtront ici
                avec leurs statuts KYC.
              </p>
            </section>
          )}

          {/* Interactive manager (toolbar + bulk bar + table + modals) */}
          {total > 0 && (
            <div className="space-y-4">
              <UsersManager users={users} />
            </div>
          )}
        </div>

        {/* Sidebar realtime audit */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <header className="mb-3 flex items-center gap-2">
              <span className="relative inline-flex size-2.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-kaza-green opacity-75" />
                <span className="relative inline-block size-2.5 rounded-full bg-kaza-green" />
              </span>
              <h2 className="font-heading text-sm font-bold text-kaza-navy">
                Activité admin temps réel
              </h2>
            </header>
            {userAuditFeed.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Aucune action admin sur les comptes pour le moment.
              </p>
            ) : (
              <ol className="space-y-3">
                {userAuditFeed.map((log) => (
                  <li key={log.id} className="flex gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-kaza-navy/10 text-kaza-navy">
                      <Activity className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground">
                        <span className="font-semibold text-kaza-navy">
                          {log.adminName}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {ACTION_LABEL[log.action] ?? log.action}
                        </span>{" "}
                        {log.targetLabel && (
                          <span className="font-medium text-kaza-navy">
                            {log.targetLabel}
                          </span>
                        )}
                      </p>
                      {log.reason && (
                        <p className="mt-1 line-clamp-2 text-[11px] italic text-muted-foreground">
                          « {log.reason} »
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {timeAgo(log.createdAt)}
                        {log.ipAddress ? ` · IP ${log.ipAddress}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
