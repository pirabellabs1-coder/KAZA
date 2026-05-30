"use client";

// =============================================================================
// KAZA — Liste des recherches sauvegardées & alertes (espace locataire)
// Permet de relancer une recherche ou de supprimer une entrée.
// =============================================================================

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Bookmark, Search, Trash2, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import {
  deleteSavedSearch,
  type SavedSearchRow,
} from "@/actions/saved-searches";

function buildUrl(criteria: SavedSearchRow["criteria"]): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(criteria)) {
    if (v) sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function SavedSearchList({ initial }: { initial: SavedSearchRow[] }) {
  const [rows, setRows] = useState<SavedSearchRow[]>(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const res = await deleteSavedSearch(id);
      if (res.success) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Supprimé.");
      } else {
        toast.error(res.error);
      }
      setPendingId(null);
    });
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-muted/20 py-10 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-muted">
          <Search className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Aucune recherche enregistrée
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Depuis la page de recherche, cliquez sur « Sauvegarder » ou « Alerte »
          pour conserver vos critères et être notifié des nouveaux biens.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/search">Lancer une recherche</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={
                "flex size-10 shrink-0 items-center justify-center rounded-xl " +
                (r.isAlert
                  ? "bg-kaza-green/10 text-kaza-green"
                  : "bg-kaza-blue/10 text-kaza-blue")
              }
            >
              {r.isAlert ? (
                <Bell className="size-5" />
              ) : (
                <Bookmark className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {r.label}
              </p>
              <Badge
                variant="outline"
                className="mt-0.5 text-[10px] font-medium"
              >
                {r.isAlert ? "Alerte active" : "Recherche sauvegardée"}
              </Badge>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={buildUrl(r.criteria)}>Relancer</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={pendingId === r.id}
              onClick={() => remove(r.id)}
              aria-label="Supprimer"
            >
              {pendingId === r.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
