"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Persistance du brouillon de creation d'annonce dans localStorage.
 *
 * - Cle: `kaza:property-draft`
 * - On exclut volontairement les `photos` (File[]) car elles ne sont pas
 *   serialisables et leur taille depasse vite le quota localStorage.
 * - L'ecriture est debouncee (250ms) pour eviter de saturer le storage
 *   lors de la frappe au clavier.
 */

const DRAFT_KEY = "kaza:property-draft";
const DEBOUNCE_MS = 250;

// Champs exclus de la persistance (non serialisables)
const EXCLUDED_KEYS = new Set(["photos"]);

export type PropertyDraft = Record<string, unknown>;

interface UsePropertyDraftReturn {
  /** Charge le brouillon depuis localStorage. Renvoie null si absent. */
  loadDraft: () => PropertyDraft | null;
  /** Sauvegarde (debouncee) le brouillon dans localStorage. */
  saveDraft: (values: PropertyDraft) => void;
  /** Supprime le brouillon de localStorage. */
  clearDraft: () => void;
  /** Indique si un brouillon a ete restaure au montage. */
  hasRestoredDraft: boolean;
  /** Reset le flag de restauration apres affichage du toast. */
  acknowledgeRestore: () => void;
}

function stripExcluded(values: PropertyDraft): PropertyDraft {
  const cleaned: PropertyDraft = {};
  for (const [key, value] of Object.entries(values)) {
    if (EXCLUDED_KEYS.has(key)) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

export function usePropertyDraft(): UsePropertyDraftReturn {
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkedRef = useRef(false);

  // Au montage, on verifie s'il existe un brouillon stocke.
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) setHasRestoredDraft(true);
    } catch {
      // localStorage inaccessible (mode prive, quota, etc.) — ignore.
    }
  }, []);

  const loadDraft = useCallback((): PropertyDraft | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PropertyDraft;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const saveDraft = useCallback((values: PropertyDraft) => {
    if (typeof window === "undefined") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        const cleaned = stripExcluded(values);
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(cleaned));
      } catch {
        // quota depasse / serialisation impossible — ignore silencieusement.
      }
    }, DEBOUNCE_MS);
  }, []);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setHasRestoredDraft(false);
  }, []);

  const acknowledgeRestore = useCallback(() => {
    setHasRestoredDraft(false);
  }, []);

  // Cleanup du timeout au demontage.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    loadDraft,
    saveDraft,
    clearDraft,
    hasRestoredDraft,
    acknowledgeRestore,
  };
}
