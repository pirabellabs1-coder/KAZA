// =============================================================================
// Kaabo — Drapeaux pays en SVG inline
//
// Sur Windows, les emojis drapeaux régionaux (🇧🇯 🇨🇮 etc.) ne sont pas
// rendus nativement — ils s'affichent comme leurs codes (BJ, CI, etc.).
// Pour garantir un rendu correct sur toutes les plateformes (Windows, macOS,
// iOS, Android, Linux), on rend les drapeaux en SVG inline.
//
// Avantages :
// - Aucune dépendance externe (offline PWA OK)
// - Taille minimale (< 1ko par drapeau)
// - Vectoriel (rendu net à toutes les tailles)
// - Couleurs officielles
// =============================================================================

import type { JSX } from "react";

import { cn } from "@/lib/utils";

interface CountryFlagProps {
  code: string; // ISO alpha-2 (BJ, CI, SN, TG, BF, GH, NG)
  className?: string;
  /** Forme : carré arrondi (par défaut) ou rectangle 4:3 */
  shape?: "rounded" | "rect";
  title?: string;
}

/**
 * Bénin — vert (1/3 gauche), jaune (haut droite), rouge (bas droite)
 * Ratio officiel 2:3
 */
function FlagBJ() {
  return (
    <svg viewBox="0 0 6 4" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <rect width="2" height="4" fill="#008751" />
      <rect x="2" width="4" height="2" fill="#FCD116" />
      <rect x="2" y="2" width="4" height="2" fill="#E8112D" />
    </svg>
  );
}

/**
 * Côte d'Ivoire — orange, blanc, vert (verticales)
 */
function FlagCI() {
  return (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <rect width="1" height="2" fill="#FF7900" />
      <rect x="1" width="1" height="2" fill="#FFFFFF" />
      <rect x="2" width="1" height="2" fill="#009E60" />
    </svg>
  );
}

/**
 * Sénégal — vert, jaune, rouge (verticales) + étoile verte centrale
 */
function FlagSN() {
  return (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <rect width="1" height="2" fill="#00853F" />
      <rect x="1" width="1" height="2" fill="#FDEF42" />
      <rect x="2" width="1" height="2" fill="#E31B23" />
      {/* Étoile à 5 branches au centre */}
      <polygon
        points="1.5,0.7 1.59,0.92 1.83,0.92 1.64,1.07 1.71,1.3 1.5,1.16 1.29,1.3 1.36,1.07 1.17,0.92 1.41,0.92"
        fill="#00853F"
      />
    </svg>
  );
}

/**
 * Togo — 5 bandes horizontales alternant vert/jaune (3 vert, 2 jaune)
 * + carré rouge en haut à gauche avec étoile blanche
 */
function FlagTG() {
  return (
    <svg viewBox="0 0 30 18" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <rect width="30" height="18" fill="#FFCE00" />
      <rect y="0" width="30" height="3.6" fill="#006A4E" />
      <rect y="7.2" width="30" height="3.6" fill="#006A4E" />
      <rect y="14.4" width="30" height="3.6" fill="#006A4E" />
      <rect width="11" height="11" fill="#D21034" />
      <polygon
        points="5.5,2.8 6.4,5 8.7,5 6.9,6.5 7.6,8.8 5.5,7.3 3.4,8.8 4.1,6.5 2.3,5 4.6,5"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * Burkina Faso — 2 bandes horizontales rouge/vert + étoile jaune centrale
 */
function FlagBF() {
  return (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <rect width="3" height="1" fill="#EF2B2D" />
      <rect y="1" width="3" height="1" fill="#009E49" />
      <polygon
        points="1.5,0.65 1.65,1.0 2.0,1.0 1.72,1.22 1.83,1.55 1.5,1.35 1.17,1.55 1.28,1.22 1.0,1.0 1.35,1.0"
        fill="#FCD116"
      />
    </svg>
  );
}

/**
 * Ghana — 3 bandes horizontales rouge/jaune/vert + étoile noire centrale
 */
function FlagGH() {
  return (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <rect width="3" height="0.67" fill="#CE1126" />
      <rect y="0.67" width="3" height="0.66" fill="#FCD116" />
      <rect y="1.33" width="3" height="0.67" fill="#006B3F" />
      <polygon
        points="1.5,0.78 1.6,1.0 1.82,1.0 1.64,1.13 1.7,1.34 1.5,1.21 1.3,1.34 1.36,1.13 1.18,1.0 1.4,1.0"
        fill="#000000"
      />
    </svg>
  );
}

/**
 * Nigeria — 3 bandes verticales vert/blanc/vert
 */
function FlagNG() {
  return (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <rect width="1" height="2" fill="#008751" />
      <rect x="1" width="1" height="2" fill="#FFFFFF" />
      <rect x="2" width="1" height="2" fill="#008751" />
    </svg>
  );
}

/**
 * Fallback générique — globe gris si pays inconnu
 */
function FlagFallback() {
  return (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <rect width="3" height="2" fill="#94A3B8" />
      <circle cx="1.5" cy="1" r="0.6" fill="none" stroke="#FFFFFF" strokeWidth="0.08" />
      <line x1="0.9" y1="1" x2="2.1" y2="1" stroke="#FFFFFF" strokeWidth="0.08" />
      <ellipse cx="1.5" cy="1" rx="0.3" ry="0.6" fill="none" stroke="#FFFFFF" strokeWidth="0.08" />
    </svg>
  );
}

const FLAG_COMPONENTS: Record<string, () => JSX.Element> = {
  BJ: FlagBJ,
  CI: FlagCI,
  SN: FlagSN,
  TG: FlagTG,
  BF: FlagBF,
  GH: FlagGH,
  NG: FlagNG,
};

export function CountryFlag({
  code,
  className,
  shape = "rounded",
  title,
}: CountryFlagProps) {
  const upper = (code ?? "").toUpperCase();
  // 1) Drapeau dessiné à la main (marchés ouest-africains live) — vectoriel,
  //    offline-friendly. 2) Sinon, pour tout code ISO alpha-2 valide, on charge
  //    le drapeau officiel depuis flagcdn.com (couvre les 54 pays africains et
  //    au-delà). 3) Fallback globe gris si le code est invalide.
  const Component = FLAG_COMPONENTS[upper];
  const isIsoAlpha2 = /^[A-Z]{2}$/.test(upper);

  return (
    <span
      className={cn(
        "inline-block overflow-hidden ring-1 ring-black/10",
        shape === "rounded" ? "rounded-sm" : "rounded-none",
        className,
      )}
      title={title ?? upper}
      role="img"
      aria-label={`Drapeau ${upper}`}
    >
      {Component ? (
        <Component />
      ) : isIsoAlpha2 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://flagcdn.com/${upper.toLowerCase()}.svg`}
          alt={`Drapeau ${upper}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <FlagFallback />
      )}
    </span>
  );
}

/**
 * Variante "globe" pour le tab "Tous les pays"
 */
export function GlobeFlag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-kaza-blue to-kaza-navy text-white",
        className,
      )}
      role="img"
      aria-label="Tous les pays"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3/5">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    </span>
  );
}
