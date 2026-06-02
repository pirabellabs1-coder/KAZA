"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Auto-save générique pour n'importe quel formulaire/éditeur.
 *
 * - Stockage localStorage, clé fournie par l'appelant.
 * - Sauvegarde debouncée (par défaut 800ms après la dernière modif).
 * - Expose un statut visuel ("idle" | "saving" | "saved" | "error")
 *   pour afficher un badge "Sauvegardé il y a 2s" / "Sauvegarde en cours…".
 * - Restore au montage (renvoie `restored` une fois).
 * - Champs exclus serialization (ex: File[], Blob) via `excludeKeys`.
 */

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  /** Clé localStorage. Préfixe recommandé `kaza:` */
  key: string;
  /** Données à persister */
  data: T;
  /** Délai de debounce avant d'écrire (ms). Défaut 800. */
  debounceMs?: number;
  /** Champs à exclure de la serialisation (typiquement File[], Blob). */
  excludeKeys?: string[];
  /** Activer/désactiver l'auto-save (ex: pour bloquer après "publication"). */
  enabled?: boolean;
}

interface UseAutoSaveReturn<T> {
  /** Statut courant pour l'affichage UI */
  status: AutoSaveStatus;
  /** Horodatage de la dernière sauvegarde réussie (Date.now()) */
  lastSavedAt: number | null;
  /** Texte humain ex: "Sauvegardé il y a 2s" */
  statusLabel: string;
  /** Restore manuel des données depuis localStorage */
  restore: () => T | null;
  /** Force une sauvegarde immédiate */
  flush: () => void;
  /** Supprime la sauvegarde (après publication réussie par ex.) */
  clear: () => void;
  /** True si des données ont été restaurées au montage */
  hasRestoredDraft: boolean;
  /** Pour acquitter le toast de restauration */
  acknowledgeRestore: () => void;
}

function stripExcluded<T extends object>(
  data: T,
  exclude: Set<string>,
): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (exclude.has(k)) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

function formatRelative(ts: number | null): string {
  if (ts == null) return "Non sauvegardé";
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return "Sauvegardé à l'instant";
  if (s < 60) return `Sauvegardé il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `Sauvegardé il y a ${m} min`;
  const h = Math.floor(m / 60);
  return `Sauvegardé il y a ${h}h`;
}

export function useAutoSave<T extends object>({
  key,
  data,
  debounceMs = 800,
  excludeKeys = [],
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [tick, setTick] = useState(0); // refresh label every 30s

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkedRef = useRef(false);
  const excludeRef = useRef(new Set(excludeKeys));

  // Detect existing draft at mount
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- setState intentionnel dans un effet (init/hydratation SSR-safe, abonnement navigateur ou souscription externe) — pattern correct, pas de cascade de rendu problematique
        setHasRestoredDraft(true);
        const parsed = JSON.parse(raw) as { __savedAt?: number };
        if (parsed?.__savedAt) setLastSavedAt(parsed.__savedAt);
      }
    } catch {
      // ignore
    }
  }, [key]);

  // Refresh "il y a Xs" label every 30s
  useEffect(() => {
    if (lastSavedAt == null) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  // Debounced write
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState intentionnel dans un effet (init/hydratation SSR-safe, abonnement navigateur ou souscription externe) — pattern correct, pas de cascade de rendu problematique
    setStatus("saving");

    debounceRef.current = setTimeout(() => {
      try {
        const cleaned = stripExcluded(data, excludeRef.current);
        const now = Date.now();
        window.localStorage.setItem(
          key,
          JSON.stringify({ ...cleaned, __savedAt: now }),
        );
        setLastSavedAt(now);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data, enabled, key, debounceMs]);

  const restore = useCallback((): T | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as T & { __savedAt?: number };
      // strip internal metadata before returning
      const { __savedAt: _omitted, ...rest } = parsed;
      void _omitted;
      return rest as T;
    } catch {
      return null;
    }
  }, [key]);

  const flush = useCallback(() => {
    if (typeof window === "undefined") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    try {
      const cleaned = stripExcluded(data, excludeRef.current);
      const now = Date.now();
      window.localStorage.setItem(
        key,
        JSON.stringify({ ...cleaned, __savedAt: now }),
      );
      setLastSavedAt(now);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [data, key]);

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setLastSavedAt(null);
    setStatus("idle");
    setHasRestoredDraft(false);
  }, [key]);

  const acknowledgeRestore = useCallback(() => {
    setHasRestoredDraft(false);
  }, []);

  const statusLabel =
    status === "saving"
      ? "Sauvegarde en cours…"
      : status === "error"
        ? "Échec de la sauvegarde"
        : tick >= 0
          ? formatRelative(lastSavedAt)
          : formatRelative(lastSavedAt);

  return {
    status,
    lastSavedAt,
    statusLabel,
    restore,
    flush,
    clear,
    hasRestoredDraft,
    acknowledgeRestore,
  };
}
