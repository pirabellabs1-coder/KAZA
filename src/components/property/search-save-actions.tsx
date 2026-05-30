"use client";

// =============================================================================
// KAZA — Boutons "Sauvegarder" et "Alerte" de la page recherche
//
// Persistent les critères courants via les server actions saveSearch().
// Si l'utilisateur n'est pas connecté, on le redirige vers /login.
// =============================================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BookmarkPlus, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import { saveSearch, type SearchCriteria } from "@/actions/saved-searches";

interface SearchSaveActionsProps {
  criteria: SearchCriteria;
  /** Rend uniquement le bouton "Créer une alerte" (CTA en bas de page). */
  alertOnly?: boolean;
}

export function SearchSaveActions({
  criteria,
  alertOnly = false,
}: SearchSaveActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedDone, setSavedDone] = useState(false);
  const [alertDone, setAlertDone] = useState(false);
  const [mode, setMode] = useState<"save" | "alert" | null>(null);

  function run(isAlert: boolean) {
    setMode(isAlert ? "alert" : "save");
    startTransition(async () => {
      const res = await saveSearch(criteria, isAlert);
      if (res.success) {
        if (isAlert) {
          setAlertDone(true);
          toast.success(
            "Alerte créée — vous serez notifié des nouveaux biens correspondants.",
          );
        } else {
          setSavedDone(true);
          toast.success("Recherche sauvegardée dans votre espace.");
        }
      } else {
        const needLogin = /connect/i.test(res.error);
        toast.error(res.error);
        if (needLogin) {
          const params = new URLSearchParams(
            criteria as Record<string, string>,
          ).toString();
          router.push(
            `/login?redirect=${encodeURIComponent(`/search?${params}`)}`,
          );
        }
      }
      setMode(null);
    });
  }

  if (alertOnly) {
    return (
      <Button
        type="button"
        size="lg"
        disabled={pending}
        onClick={() => run(true)}
        className="gap-2 bg-kaza-green text-base shadow-lg hover:bg-kaza-green/90"
      >
        {pending && mode === "alert" ? (
          <Loader2 className="size-5 animate-spin" />
        ) : alertDone ? (
          <Check className="size-5" />
        ) : (
          <Bell className="size-5" />
        )}
        {alertDone ? "Alerte créée" : "Créer une alerte"}
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(false)}
        className="hidden gap-1.5 sm:inline-flex"
      >
        {pending && mode === "save" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : savedDone ? (
          <Check className="size-4 text-kaza-green" />
        ) : (
          <BookmarkPlus className="size-4" />
        )}
        {savedDone ? "Sauvegardée" : "Sauvegarder"}
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => run(true)}
        className="gap-1.5 bg-kaza-green hover:bg-kaza-green/90"
      >
        {pending && mode === "alert" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : alertDone ? (
          <Check className="size-4" />
        ) : (
          <Bell className="size-4" />
        )}
        {alertDone ? "Alerte créée" : "Alerte"}
      </Button>
    </>
  );
}
