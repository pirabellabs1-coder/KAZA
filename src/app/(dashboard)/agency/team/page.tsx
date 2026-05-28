import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Mail,
  Phone,
  Users,
  UserCheck,
  UserPlus,
  Clock,
  CalendarDays,
  Shield,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  getTeamStats,
  listTeamMembers,
  type AgencyRole,
  type AgencyMemberStatus,
  type AgencyTeamMember,
} from "@/lib/queries/agency-team";

import { InviteMemberDialog } from "./invite-member-dialog";
import { MemberActions } from "./member-actions";

export const metadata: Metadata = {
  title: "Équipe — KAZA Agence",
  description:
    "Pilotez les membres de votre agence, leurs permissions et leurs invitations.",
};

// ---------------------------------------------------------------------------
// Constantes de présentation
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<AgencyRole, string> = {
  DIRECTOR: "Directeur·rice",
  MANAGER: "Manager",
  AGENT_SENIOR: "Agent senior",
  AGENT: "Agent",
  INTERN: "Stagiaire",
  ACCOUNTANT: "Comptable",
};

const ROLE_COLORS: Record<AgencyRole, string> = {
  DIRECTOR: "bg-kaza-navy text-white",
  MANAGER: "bg-kaza-blue text-white",
  AGENT_SENIOR: "bg-kaza-blue/10 text-kaza-blue",
  AGENT: "bg-kaza-green/10 text-kaza-green",
  INTERN: "bg-cyan-100 text-cyan-700",
  ACCOUNTANT: "bg-emerald-100 text-emerald-700",
};

const STATUS_LABELS: Record<AgencyMemberStatus, string> = {
  ACTIVE: "Actif",
  ON_LEAVE: "En congé",
  INVITED: "Invité",
  REMOVED: "Retiré",
};

const STATUS_COLORS: Record<AgencyMemberStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ON_LEAVE: "bg-amber-100 text-amber-700",
  INVITED: "bg-slate-100 text-slate-700",
  REMOVED: "bg-rose-100 text-rose-700",
};

const ALL_PERMISSIONS = [
  { key: "admin", label: "Administration" },
  { key: "billing", label: "Facturation" },
  { key: "team", label: "Équipe" },
  { key: "analytics", label: "Analytics" },
  { key: "properties", label: "Biens" },
  { key: "visits", label: "Visites" },
  { key: "tenants", label: "Locataires" },
  { key: "contracts", label: "Contrats" },
];

function formatDateFr(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgencyTeamPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?redirect=/agency/team");
  }

  const [members, stats] = await Promise.all([
    listTeamMembers(user.id),
    getTeamStats(user.id),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy">
            Équipe
          </h1>
          <p className="mt-1 text-muted-foreground">
            {stats.total} {stats.total > 1 ? "collaborateurs" : "collaborateur"}
            {stats.invited > 0 ? ` · ${stats.invited} invitations en attente` : ""}
          </p>
        </div>
        <InviteMemberDialog />
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          icon={<Users className="size-5 text-kaza-navy" />}
          label="Total membres"
          value={stats.total.toString()}
          subtitle="actifs + congé + invités"
        />
        <StatBlock
          icon={<UserCheck className="size-5 text-kaza-green" />}
          label="Agents actifs"
          value={stats.active.toString()}
          subtitle="sur le terrain"
        />
        <StatBlock
          icon={<Clock className="size-5 text-amber-600" />}
          label="En congé"
          value={stats.onLeave.toString()}
          subtitle="momentanément indisponibles"
        />
        <StatBlock
          icon={<Mail className="size-5 text-kaza-blue" />}
          label="Invitations"
          value={stats.invited.toString()}
          subtitle="en attente d'acceptation"
        />
      </div>

      {/* Empty state */}
      {members.length === 0 ? (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-kaza-navy/10">
              <UserPlus className="size-8 text-kaza-navy" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-semibold text-kaza-navy">
                Construisez votre équipe
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Invitez vos premiers agents, managers ou stagiaires pour
                commencer à piloter votre agence en collectif.
              </p>
            </div>
            <InviteMemberDialog />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Liste équipe */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-kaza-navy">
                Membres de l&apos;agence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membre</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Contact
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Embauche
                      </TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TeamRow key={member.id} member={member} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Matrice des permissions */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-kaza-navy/10">
                <Shield className="size-5 text-kaza-navy" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg text-kaza-navy">
                  Matrice des permissions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Qui peut faire quoi dans l&apos;espace agence
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membre</TableHead>
                      {ALL_PERMISSIONS.map((p) => (
                        <TableHead
                          key={p.key}
                          className="text-center text-xs"
                        >
                          {p.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={`perm-${member.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar name={member.fullName} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {member.fullName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {ROLE_LABELS[member.role]}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        {ALL_PERMISSIONS.map((p) => (
                          <TableCell
                            key={p.key}
                            className="text-center text-xs"
                          >
                            {member.permissions.includes(p.key) ? (
                              <span className="text-kaza-green">✓</span>
                            ) : (
                              <span className="text-muted-foreground/40">
                                ·
                              </span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

interface StatBlockProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}

function StatBlock({ icon, label, value, subtitle }: StatBlockProps) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
          {icon}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-kaza-navy">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const initials = initialsOf(name);
  const dimensionClass = size === "sm" ? "size-8 text-xs" : "size-10 text-sm";
  return (
    <div
      className={`flex ${dimensionClass} items-center justify-center rounded-full bg-kaza-navy font-semibold text-white`}
    >
      {initials || "?"}
    </div>
  );
}

function TeamRow({ member }: { member: AgencyTeamMember }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar name={member.fullName} />
          <div className="min-w-0">
            <p className="font-medium text-foreground">{member.fullName}</p>
            {member.email && (
              <p className="truncate text-xs text-muted-foreground">
                {member.email}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="space-y-1 text-sm">
          {member.email && (
            <div className="flex items-center gap-1.5 text-foreground">
              <Mail className="size-3.5 text-muted-foreground" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="size-3.5" />
              <span>{member.phone}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {formatDateFr(member.hiredAt)}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={ROLE_COLORS[member.role]}>
          {ROLE_LABELS[member.role]}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={STATUS_COLORS[member.status]}>
          {STATUS_LABELS[member.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <MemberActions
          memberId={member.id}
          memberName={member.fullName}
          currentRole={member.role}
        />
      </TableCell>
    </TableRow>
  );
}
