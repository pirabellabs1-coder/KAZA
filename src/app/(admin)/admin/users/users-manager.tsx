"use client";

import { useMemo, useState, useTransition } from "react";
import {
  MoreHorizontal,
  Search,
  Download,
  UserPlus,
  Eye,
  Ban,
  ShieldOff,
  UserCheck,
  Mail,
  KeyRound,
  UserCog,
  LogOut,
  UserSearch,
  Trash2,
  History,
  AlertTriangle,
  Crown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn, formatFcfa } from "@/lib/utils";
import {
  STATUS_COLORS_USER,
  STATUS_LABELS_USER,
  ROLE_LABELS,
  type AdminUser,
  type UserRole,
} from "./types";
import { suspendUsers, banUsers } from "./actions";
import { CountryFlag } from "@/components/shared/country-flag";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_BADGE: Record<UserRole, string> = {
  OWNER: "bg-blue-100 text-kaza-blue border-blue-200",
  TENANT: "bg-emerald-100 text-emerald-700 border-emerald-200",
  STUDENT: "bg-amber-100 text-amber-700 border-amber-200",
  AGENCY: "bg-kaza-navy/10 text-kaza-navy border-kaza-navy/20",
  ADMIN: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

function initials(u: AdminUser): string {
  return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
}

function avatarColor(seed: string): string {
  const palette = [
    "bg-kaza-blue/15 text-kaza-blue",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-kaza-navy/15 text-kaza-navy",
    "bg-rose-100 text-rose-700",
    "bg-violet-100 text-violet-700",
  ];
  const hash = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[hash % palette.length]!;
}

function relativeFromDays(iso: string): string {
  const now = new Date("2026-05-27").getTime();
  const diff = now - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "aujourd’hui";
  if (days < 30) return `il y a ${days} j`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

function TrustCircle({ score }: { score: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75 ? "stroke-kaza-green" : score >= 50 ? "stroke-amber-500" : "stroke-red-500";
  return (
    <div className="relative inline-flex h-9 w-9 items-center justify-center">
      <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={radius} fill="none" strokeWidth="3" className="stroke-slate-200" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <span className="absolute text-[10px] font-bold tabular-nums text-slate-700">
        {score}
      </span>
    </div>
  );
}

function VerificationBadge({ v }: { v: AdminUser["verification"] }) {
  if (v === "VERIFIED")
    return (
      <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
        KYC ✓
      </Badge>
    );
  if (v === "PENDING")
    return (
      <Badge className="border-blue-200 bg-blue-100 text-blue-700">En attente</Badge>
    );
  if (v === "REJECTED")
    return (
      <Badge className="border-red-200 bg-red-100 text-red-700">✗ Refusé</Badge>
    );
  return <Badge className="border-slate-200 bg-slate-100 text-slate-500">—</Badge>;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type SortKey = "signup_desc" | "lastlogin_desc" | "trust_desc";

export function UsersManager({ users }: { users: AdminUser[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("signup_desc");
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState<number>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<null | {
    type: "suspend" | "ban";
    targetIds: string[];
  }>(null);
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [, startTransition] = useTransition();

  // ----- Filtering / sorting -----
  const filtered = useMemo(() => {
    let list = users.slice();
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.id.includes(q),
      );
    }
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    if (countryFilter !== "all")
      list = list.filter((u) => u.country === countryFilter);
    if (statusFilter !== "all")
      list = list.filter((u) => u.status === statusFilter);

    list.sort((a, b) => {
      if (sort === "signup_desc")
        return new Date(b.signupAt).getTime() - new Date(a.signupAt).getTime();
      if (sort === "lastlogin_desc")
        return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
      return b.trustScore - a.trustScore;
    });
    return list;
  }, [users, search, roleFilter, countryFilter, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const allOnPageSelected =
    paginated.length > 0 && paginated.every((u) => selected.has(u.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paginated.forEach((u) => next.delete(u.id));
      else paginated.forEach((u) => next.add(u.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (!confirm) return;
    if (reason.trim().length < 3) return;
    startTransition(async () => {
      if (confirm.type === "suspend")
        await suspendUsers(confirm.targetIds, reason, notify);
      else await banUsers(confirm.targetIds, reason, notify);
      setConfirm(null);
      setReason("");
      setSelected(new Set());
    });
  };

  return (
    <>
      {/* Toolbar */}
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Nom, email, téléphone, ID…"
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-[140px]">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous rôles</SelectItem>
                <SelectItem value="OWNER">Propriétaires</SelectItem>
                <SelectItem value="TENANT">Locataires</SelectItem>
                <SelectItem value="STUDENT">Étudiants</SelectItem>
                <SelectItem value="AGENCY">Agences</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-[130px]">
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous pays</SelectItem>
                <SelectItem value="BJ">Bénin</SelectItem>
                <SelectItem value="CI">Côte d&rsquo;Ivoire</SelectItem>
                <SelectItem value="SN">Sénégal</SelectItem>
                <SelectItem value="TG">Togo</SelectItem>
                <SelectItem value="BF">Burkina</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="PENDING_KYC">KYC en attente</SelectItem>
                <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                <SelectItem value="BANNED">Banni</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Trier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="signup_desc">Inscription récente</SelectItem>
                <SelectItem value="lastlogin_desc">Connexion récente</SelectItem>
                <SelectItem value="trust_desc">Trust score ↓</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="col-span-2 lg:col-span-1">
              <Download className="size-4" />
              Exporter CSV
            </Button>
            <Button className="col-span-2 bg-kaza-blue hover:bg-kaza-blue/90 lg:col-span-1">
              <UserPlus className="size-4" />
              Inviter un utilisateur
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk action sticky bar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-kaza-blue/30 bg-kaza-blue/5 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold text-kaza-navy">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-kaza-blue px-2 text-xs text-white">
              {selected.size}
            </span>
            sélectionné{selected.size > 1 ? "s" : ""}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() =>
                setConfirm({ type: "suspend", targetIds: Array.from(selected) })
              }
            >
              <Ban className="size-4" /> Suspendre
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() =>
                setConfirm({ type: "ban", targetIds: Array.from(selected) })
              }
            >
              <ShieldOff className="size-4" /> Bannir
            </Button>
            <Button size="sm" variant="outline">
              <UserCheck className="size-4" /> Vérifier KYC
            </Button>
            <Button size="sm" variant="outline">
              <Mail className="size-4" /> Envoyer email
            </Button>
            <Button size="sm" variant="outline">
              <Download className="size-4" /> Exporter
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner"
                    checked={allOnPageSelected}
                    onChange={toggleAll}
                    className="size-4 cursor-pointer rounded border-slate-300 text-kaza-blue focus:ring-kaza-blue"
                  />
                </TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Trust</TableHead>
                <TableHead>Total dépensé</TableHead>
                <TableHead>Inscrit</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((u) => {
                const isSelected = selected.has(u.id);
                return (
                  <TableRow
                    key={u.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      u.flag === "fraud_suspect" && "bg-red-50/40",
                      u.flag === "vip" && "bg-amber-50/40",
                    )}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner ${u.firstName}`}
                        checked={isSelected}
                        onChange={() => toggleOne(u.id)}
                        className="size-4 cursor-pointer rounded border-slate-300 text-kaza-blue focus:ring-kaza-blue"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={cn(
                              "flex size-10 items-center justify-center rounded-full text-sm font-bold",
                              avatarColor(u.id),
                            )}
                          >
                            {initials(u)}
                          </div>
                          <CountryFlag
                            code={u.country}
                            className="absolute -bottom-1 -right-1 h-3 w-4 ring-2 ring-white"
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-kaza-navy">
                              {u.firstName} {u.lastName}
                            </span>
                            {u.flag === "vip" && (
                              <Crown className="size-3.5 text-amber-500" />
                            )}
                            {u.flag === "fraud_suspect" && (
                              <AlertTriangle className="size-3.5 text-red-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                          <span className="text-[11px] text-muted-foreground">{u.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border", ROLE_BADGE[u.role])}>
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS_USER[u.status]}>
                        {STATUS_LABELS_USER[u.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <VerificationBadge v={u.verification} />
                    </TableCell>
                    <TableCell>
                      <TrustCircle score={u.trustScore} />
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {u.totalSpentFcfa > 0 ? formatFcfa(u.totalSpentFcfa) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {relativeFromDays(u.signupAt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {relativeFromDays(u.lastLoginAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" className="h-8">
                          <Eye className="size-3.5" /> Voir
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setConfirm({ type: "suspend", targetIds: [u.id] })}
                            >
                              <Ban className="size-4 text-amber-600" /> Suspendre
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setConfirm({ type: "ban", targetIds: [u.id] })}
                            >
                              <ShieldOff className="size-4" /> Bannir
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserCheck className="size-4 text-emerald-600" /> Réactiver
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <UserCog className="size-4" /> Changer rôle
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <LogOut className="size-4" /> Forcer logout
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <KeyRound className="size-4" /> Réinitialiser mot de passe
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserSearch className="size-4" /> Impersonner
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <History className="size-4" /> Voir audit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive">
                              <Trash2 className="size-4" /> Supprimer compte
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                    Aucun utilisateur ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-slate-50/60 px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""} · page {safePage} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              Précédent
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      <Dialog
        open={!!confirm}
        onOpenChange={(o) => {
          if (!o) {
            setConfirm(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirm?.type === "ban" ? (
                <ShieldOff className="size-5 text-red-600" />
              ) : (
                <Ban className="size-5 text-amber-600" />
              )}
              {confirm?.type === "ban" ? "Bannir" : "Suspendre"}{" "}
              {confirm && confirm.targetIds.length > 1
                ? `${confirm.targetIds.length} utilisateurs`
                : "ce compte"}{" "}
              ?
            </DialogTitle>
            <DialogDescription>
              Cette action est tracée dans l’audit log et notifiera l’équipe sécurité.
              {confirm?.type === "ban" &&
                " Le bannissement est définitif et bloque toute future inscription depuis cet email/téléphone."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reason">
                Raison <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Ex: fraude détectée, plaintes répétées, violation CGU article 7…"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="size-4 rounded border-slate-300 text-kaza-blue focus:ring-kaza-blue"
              />
              Notifier l’utilisateur par email
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirm(null);
                setReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              className={cn(
                confirm?.type === "ban"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-amber-600 hover:bg-amber-700",
                "text-white",
              )}
              disabled={reason.trim().length < 3}
              onClick={handleConfirm}
            >
              {confirm?.type === "ban" ? "Confirmer le bannissement" : "Confirmer la suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
