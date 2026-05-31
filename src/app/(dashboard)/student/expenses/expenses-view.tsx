"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Loader2,
  Receipt,
  Users,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast-helper";
import { formatFcfa } from "@/lib/utils";

import { createExpense, settleShare } from "@/actions/student-expenses";
import type {
  StudentGroup,
  GroupExpensesData,
} from "@/lib/queries/student-expenses";

type Category =
  | "RENT"
  | "UTILITIES"
  | "GROCERIES"
  | "INTERNET"
  | "CLEANING"
  | "FURNITURE"
  | "OTHER";

const CATEGORY_LABELS: Record<Category, string> = {
  RENT: "Loyer",
  UTILITIES: "Charges (eau/élec)",
  GROCERIES: "Courses",
  INTERNET: "Internet",
  CLEANING: "Ménage",
  FURNITURE: "Mobilier",
  OTHER: "Autre",
};

interface Props {
  userId: string;
  groups: StudentGroup[];
  selectedGroupId: string;
  data: GroupExpensesData | null;
}

export function ExpensesView({ userId, groups, selectedGroupId, data }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const group = groups.find((g) => g.id === selectedGroupId) ?? groups[0];

  const [form, setForm] = useState({
    title: "",
    category: "GROCERIES" as Category,
    amount: "",
    paidBy: userId,
    expenseDate: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  if (groups.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-green/10">
              <Users className="size-7 text-kaza-green" aria-hidden="true" />
            </div>
            <p className="font-heading text-lg font-semibold text-kaza-navy">
              Aucune colocation active
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Rejoignez ou créez une colocation pour partager et suivre vos frais
              avec vos colocataires.
            </p>
            <Button asChild className="mt-2">
              <Link href="/student/roommate-matching">Trouver une colocation</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreate = () => {
    const amount = Number(form.amount);
    if (form.title.trim().length < 2) {
      toast.error("Le titre est requis.");
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    if (!group) return;
    startTransition(async () => {
      const res = await createExpense({
        groupId: group.id,
        title: form.title,
        category: form.category,
        amount,
        paidBy: form.paidBy,
        expenseDate: form.expenseDate,
      });
      if (res.success) {
        toast.success("Dépense ajoutée et répartie");
        setOpen(false);
        setForm((p) => ({ ...p, title: "", amount: "" }));
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec");
      }
    });
  };

  const handleSettle = (shareId: string) => {
    startTransition(async () => {
      const res = await settleShare(shareId);
      if (res.success) {
        toast.success("Part réglée");
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec");
      }
    });
  };

  const d = data ?? {
    expenses: [],
    balances: [],
    totalSpent: 0,
    myBalance: 0,
    myShareUnsettled: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Header />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" aria-hidden="true" />
              Ajouter une dépense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle dépense partagée</DialogTitle>
              <DialogDescription>
                Répartie en parts égales entre les {group?.members.length ?? 0}{" "}
                colocataires.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Intitulé</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex : Courses du mois"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Catégorie</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => set("category", v as Category)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Montant (FCFA)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={0}
                    value={form.amount}
                    onChange={(e) => set("amount", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Payé par</Label>
                  <Select
                    value={form.paidBy}
                    onValueChange={(v) => set("paidBy", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(group?.members ?? []).map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.userId === userId ? "Moi" : m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => set("expenseDate", e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sélecteur de groupe si plusieurs */}
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <Button
              key={g.id}
              asChild
              size="sm"
              variant={g.id === selectedGroupId ? "default" : "outline"}
            >
              <Link href={`/student/expenses?group=${g.id}`}>{g.name}</Link>
            </Button>
          ))}
        </div>
      )}

      {/* Résumé */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="size-4 text-kaza-blue" /> Total dépensé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(d.totalSpent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              {d.myBalance >= 0 ? (
                <ArrowUpCircle className="size-4 text-kaza-green" />
              ) : (
                <ArrowDownCircle className="size-4 text-rose-500" />
              )}
              Mon solde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`font-heading text-2xl font-bold ${
                d.myBalance >= 0 ? "text-kaza-green" : "text-rose-600"
              }`}
            >
              {d.myBalance >= 0
                ? `+${formatFcfa(d.myBalance)}`
                : `-${formatFcfa(Math.abs(d.myBalance))}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {d.myBalance >= 0 ? "On vous doit" : "Vous devez"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Receipt className="size-4 text-amber-500" /> Reste à régler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(d.myShareUnsettled)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Soldes par colocataire */}
      {d.balances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Soldes des colocataires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.balances.map((b) => (
              <div
                key={b.userId}
                className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-sm"
              >
                <span className="font-medium text-foreground">
                  {b.userId === userId ? "Moi" : b.name}
                </span>
                <span
                  className={
                    b.balance >= 0
                      ? "font-semibold text-kaza-green"
                      : "font-semibold text-rose-600"
                  }
                >
                  {b.balance >= 0
                    ? `+${formatFcfa(b.balance)}`
                    : `-${formatFcfa(Math.abs(b.balance))}`}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Liste des dépenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dépenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {d.expenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune dépense pour l&apos;instant. Ajoutez-en une pour commencer.
            </p>
          ) : (
            d.expenses.map((e) => {
              const myShare = e.shares.find((s) => s.userId === userId);
              return (
                <div
                  key={e.id}
                  className="rounded-lg border border-border/70 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[e.category as Category] ?? e.category} ·{" "}
                        {new Date(e.expenseDate).toLocaleDateString("fr-FR")} ·
                        payé par {e.paidById === userId ? "moi" : e.paidByName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-kaza-navy">
                        {formatFcfa(e.amountFcfa)}
                      </p>
                      {myShare && (
                        <p className="text-xs text-muted-foreground">
                          Ma part : {formatFcfa(myShare.shareFcfa)}
                        </p>
                      )}
                    </div>
                  </div>
                  {myShare && myShare.userId !== e.paidById && (
                    <div className="mt-2 flex justify-end">
                      {myShare.settled ? (
                        <Badge className="gap-1 bg-kaza-green/15 text-kaza-green">
                          <CheckCircle2 className="size-3.5" /> Réglé
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={isPending}
                          onClick={() => handleSettle(myShare.id)}
                        >
                          <CheckCircle2 className="size-3.5" /> Marquer ma part réglée
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
        Frais partagés
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Suivez et répartissez les dépenses de votre colocation, réglez vos parts.
      </p>
    </div>
  );
}
