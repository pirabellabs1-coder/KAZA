import { Building2, Home, GraduationCap, Tag, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// =============================================================================
// Kaabo - Rôles d'inscription + thème visuel par rôle
// =============================================================================
// Classes Tailwind écrites en toutes lettres (pas de concaténation dynamique)
// pour que le compilateur les détecte.
// =============================================================================

export type RoleValue = "TENANT" | "OWNER" | "STUDENT" | "BUYER" | "AGENCY";

export interface RoleMeta {
  value: RoleValue;
  label: string;
  /** Phrase d'accroche affichée sur la carte de rôle. */
  tagline: string;
  /** Ce que le rôle « je » fait (utilisé dans le titre du formulaire). */
  intro: string;
  icon: LucideIcon;
  // Thème
  accentText: string;
  iconText: string;
  softBg: string;
  solidBg: string;
  selectedBorder: string;
  hoverBorder: string;
  gradient: string;
}

export const ROLE_META: Record<RoleValue, RoleMeta> = {
  TENANT: {
    value: "TENANT",
    label: "Locataire",
    tagline: "Trouvez le logement idéal et réservez en toute sécurité.",
    intro: "Je cherche un logement à louer",
    icon: Home,
    accentText: "text-kaza-blue",
    iconText: "text-kaza-blue",
    softBg: "bg-kaza-blue/10",
    solidBg: "bg-kaza-blue hover:bg-kaza-blue/90",
    selectedBorder: "border-kaza-blue",
    hoverBorder: "hover:border-kaza-blue",
    gradient: "from-kaza-blue to-kaza-navy",
  },
  OWNER: {
    value: "OWNER",
    label: "Propriétaire",
    tagline: "Publiez vos biens et gérez vos locations sans effort.",
    intro: "Je mets un bien en location",
    icon: Building2,
    accentText: "text-kaza-navy",
    iconText: "text-kaza-navy",
    softBg: "bg-kaza-navy/10",
    solidBg: "bg-kaza-navy hover:bg-kaza-navy/90",
    selectedBorder: "border-kaza-navy",
    hoverBorder: "hover:border-kaza-navy",
    gradient: "from-kaza-navy to-slate-900",
  },
  STUDENT: {
    value: "STUDENT",
    label: "Étudiant",
    tagline: "Colocation, colocataires vérifiés et frais partagés.",
    intro: "Je cherche une colocation",
    icon: GraduationCap,
    accentText: "text-kaza-green",
    iconText: "text-kaza-green",
    softBg: "bg-kaza-green/10",
    solidBg: "bg-kaza-green hover:bg-kaza-green/90",
    selectedBorder: "border-kaza-green",
    hoverBorder: "hover:border-kaza-green",
    gradient: "from-kaza-green to-emerald-700",
  },
  BUYER: {
    value: "BUYER",
    label: "Acheteur",
    tagline: "Achetez votre bien en toute confiance, sans intermédiaire.",
    intro: "Je veux acheter un bien",
    icon: Tag,
    accentText: "text-amber-600",
    iconText: "text-amber-600",
    softBg: "bg-amber-500/10",
    solidBg: "bg-amber-500 hover:bg-amber-500/90",
    selectedBorder: "border-amber-500",
    hoverBorder: "hover:border-amber-500",
    gradient: "from-amber-500 to-orange-700",
  },
  AGENCY: {
    value: "AGENCY",
    label: "Agence",
    tagline: "Votre espace pro B2B : mandats, portefeuille, équipe.",
    intro: "Je représente une agence immobilière",
    icon: Briefcase,
    accentText: "text-purple-600",
    iconText: "text-purple-600",
    softBg: "bg-purple-500/10",
    solidBg: "bg-purple-600 hover:bg-purple-600/90",
    selectedBorder: "border-purple-600",
    hoverBorder: "hover:border-purple-600",
    gradient: "from-purple-600 to-indigo-800",
  },
};

export const ROLE_LIST: RoleMeta[] = [
  ROLE_META.TENANT,
  ROLE_META.OWNER,
  ROLE_META.STUDENT,
  ROLE_META.BUYER,
  ROLE_META.AGENCY,
];
