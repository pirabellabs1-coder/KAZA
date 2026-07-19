// =============================================================================
// KAZA - Catalogue pays / reseaux Mobile Money (FeexPay)
// =============================================================================
// Source de verite des pays couverts par l'integration API FeexPay et des
// reseaux Mobile Money disponibles dans chacun. Partage entre le serveur
// (adaptateur `feexpay.ts` : normalisation du numero, envoi du champ `reseau`)
// et le client (selecteur pays + operateur du checkout).
//
// `reseau` = valeur EXACTE attendue par l'API FeexPay pour le champ `reseau`.
// A ajuster selon les operateurs actives sur ton compte marchand FeexPay.
// =============================================================================

export interface MoMoNetwork {
  /** Valeur envoyee a FeexPay (champ `reseau`). */
  reseau: string;
  /** Libelle affiche au client. */
  label: string;
  /** Couleur de marque de l'operateur (pour l'UI du selecteur). */
  color?: string;
}

export interface MoMoCountry {
  /** Code ISO-2 (BJ, CI, TG, SN, NE). */
  code: string;
  /** Nom affiche. */
  name: string;
  /** Indicatif telephonique international sans `+` (229, 225...). */
  dialCode: string;
  /** Drapeau emoji. */
  flag: string;
  /** Longueur attendue du numero local (sans indicatif), pour l'aide a la saisie. */
  localLength: number;
  /** Reseaux Mobile Money disponibles. */
  networks: MoMoNetwork[];
}

// Pays couverts par l'integration API (onglet « Integration » FeexPay).
export const FEEXPAY_COUNTRIES: MoMoCountry[] = [
  {
    code: "BJ",
    name: "Bénin",
    dialCode: "229",
    flag: "🇧🇯",
    localLength: 10,
    networks: [
      { reseau: "MTN", label: "MTN MoMo", color: "#FFCC00" },
      { reseau: "MOOV", label: "Moov Money", color: "#0066B3" },
      { reseau: "CELTIIS", label: "Celtiis Cash", color: "#E30613" },
    ],
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    dialCode: "225",
    flag: "🇨🇮",
    localLength: 10,
    networks: [
      { reseau: "MTN CI", label: "MTN MoMo", color: "#FFCC00" },
      { reseau: "MOOV CI", label: "Moov Money", color: "#0066B3" },
      { reseau: "ORANGE CI", label: "Orange Money", color: "#FF6600" },
      { reseau: "WAVE CI", label: "Wave", color: "#1DC8FF" },
    ],
  },
  {
    code: "TG",
    name: "Togo",
    dialCode: "228",
    flag: "🇹🇬",
    localLength: 8,
    networks: [
      { reseau: "TOGOCOM TG", label: "T-Money (Togocom)", color: "#E2001A" },
      { reseau: "MOOV TG", label: "Moov Money (Flooz)", color: "#0066B3" },
    ],
  },
  {
    code: "SN",
    name: "Sénégal",
    dialCode: "221",
    flag: "🇸🇳",
    localLength: 9,
    networks: [
      { reseau: "ORANGE SN", label: "Orange Money", color: "#FF6600" },
      { reseau: "FREE SN", label: "Free Money", color: "#E2001A" },
      { reseau: "WAVE SN", label: "Wave", color: "#1DC8FF" },
    ],
  },
  {
    code: "NE",
    name: "Niger",
    dialCode: "227",
    flag: "🇳🇪",
    localLength: 8,
    networks: [
      { reseau: "AIRTEL NE", label: "Airtel Money", color: "#E2001A" },
      { reseau: "MOOV NE", label: "Moov Money", color: "#0066B3" },
    ],
  },
];

export function getCountry(code: string): MoMoCountry | undefined {
  return FEEXPAY_COUNTRIES.find((c) => c.code === code.toUpperCase());
}

/** Indicatif d'un pays (sans `+`), ou "229" (Bénin) par defaut. */
export function dialCodeFor(code: string): string {
  return getCountry(code)?.dialCode ?? "229";
}
