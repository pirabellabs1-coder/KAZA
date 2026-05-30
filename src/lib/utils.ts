import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "XOF"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export const formatFcfa = (value: number): string =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value) + " FCFA";

export const formatFcfaShort = (value: number): string => {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + " Md";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + " M";
  if (value >= 1_000) return (value / 1_000).toFixed(0) + " k";
  return value.toString();
};

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat("fr-FR").format(value);

/**
 * Resolution gracieuse de plusieurs promesses pour les pages serveur.
 *
 * Contrairement a `Promise.all`, un rejet ne fait PAS planter l'ensemble :
 * chaque promesse rejetee est remplacee par la valeur de repli fournie a la
 * meme position dans `fallbacks`. Objectif : afficher la page avec des
 * sections vides plutot qu'une erreur 500 si une requete Supabase echoue.
 *
 * @example
 *   const [stats, agencies] = await settleAll(
 *     [getAdminStats(), listAllAgencies()] as const,
 *     [EMPTY_STATS, []] as const,
 *   );
 */
export async function settleAll<T extends readonly unknown[]>(
  promises: readonly [...{ [K in keyof T]: Promise<T[K]> }],
  fallbacks: NoInfer<readonly [...T]>,
): Promise<T> {
  const results = await Promise.allSettled(promises);
  return results.map((res, i) =>
    res.status === "fulfilled" ? res.value : fallbacks[i],
  ) as unknown as T;
}

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + " GB";
};
