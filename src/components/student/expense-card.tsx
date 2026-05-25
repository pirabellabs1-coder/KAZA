"use client";

import { useState } from "react";
import {
  Zap,
  Wifi,
  Droplet,
  UtensilsCrossed,
  Home,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatPrice, formatDate, getInitials } from "@/lib/utils";

export type ExpenseCategory =
  | "Électricité"
  | "Eau"
  | "Internet"
  | "Courses"
  | "Loyer"
  | "Autre";

const CATEGORY_META: Record<
  ExpenseCategory,
  { icon: LucideIcon; tint: string }
> = {
  Électricité: { icon: Zap, tint: "text-yellow-600 bg-yellow-50" },
  Eau: { icon: Droplet, tint: "text-sky-600 bg-sky-50" },
  Internet: { icon: Wifi, tint: "text-indigo-600 bg-indigo-50" },
  Courses: { icon: UtensilsCrossed, tint: "text-emerald-600 bg-emerald-50" },
  Loyer: { icon: Home, tint: "text-rose-600 bg-rose-50" },
  Autre: { icon: MoreHorizontal, tint: "text-muted-foreground bg-muted" },
};

export interface ExpenseCardData {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  payerId: string;
  payerName: string;
  payerAvatar?: string;
  date: string; // ISO
  participants: { id: string; name: string; avatar?: string }[];
}

interface ExpenseCardProps {
  expense: ExpenseCardData;
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.Autre;
  const Icon = meta.icon;
  const share = expense.participants.length
    ? Math.round(expense.amount / expense.participants.length)
    : 0;

  const [firstName, ...rest] = expense.payerName.split(" ");
  const lastName = rest.join(" ") || firstName;

  return (
    <>
      <div className="flex items-center gap-4 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            meta.tint
          )}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {expense.title}
            </p>
            <p className="shrink-0 text-sm font-semibold">
              {formatPrice(expense.amount)}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Avatar size="sm" className="size-5">
                <AvatarImage src={expense.payerAvatar} />
                <AvatarFallback className="bg-kaza-navy text-[9px] text-white">
                  {getInitials(firstName, lastName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {expense.payerName}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {formatDate(expense.date)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <Badge variant="secondary" className="text-[10px]">
              Partagé entre {expense.participants.length} personne
              {expense.participants.length > 1 ? "s" : ""}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setOpen(true)}
            >
              Détails
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  meta.tint
                )}
              >
                <Icon className="size-4" />
              </span>
              {expense.title}
            </DialogTitle>
            <DialogDescription>
              {expense.category} · {formatDate(expense.date)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">Montant total</span>
              <span className="text-base font-semibold">
                {formatPrice(expense.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">Part par personne</span>
              <span className="font-medium">{formatPrice(share)}</span>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Payé par
              </p>
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <AvatarImage src={expense.payerAvatar} />
                  <AvatarFallback className="bg-kaza-navy text-[10px] text-white">
                    {getInitials(firstName, lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{expense.payerName}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Partagé entre
              </p>
              <ul className="space-y-2">
                {expense.participants.map((p) => {
                  const [pf, ...pr] = p.name.split(" ");
                  const pl = pr.join(" ") || pf;
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar size="sm" className="size-6">
                          <AvatarImage src={p.avatar} />
                          <AvatarFallback className="bg-kaza-navy text-[9px] text-white">
                            {getInitials(pf, pl)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{p.name}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatPrice(share)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
