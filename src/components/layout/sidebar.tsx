"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  HandCoins,
  CreditCard,
  BarChart3,
  Code2,
  Heart,
  MessageSquare,
  Home,
  Users,
  ClipboardList,
  Receipt,
  MessagesSquare,
  Settings,
  Wallet,
  Bell,
  FileText,
  Search,
  ShieldCheck,
  Star,
  Handshake,
  Coins,
  AlertOctagon,
  TrendingUp,
  GraduationCap,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const ownerNav: NavGroup[] = [
  {
    title: "Mes biens",
    items: [
      { href: "/owner/properties", label: "Mes propriétés", icon: Building2 },
      { href: "/owner/promotion", label: "Booster une annonce", icon: TrendingUp },
    ],
  },
  {
    title: "Demandes",
    items: [
      { href: "/owner/visits", label: "Demandes de visite", icon: CalendarCheck },
      { href: "/owner/applications", label: "Candidatures", icon: ClipboardList },
      { href: "/owner/calendar", label: "Calendrier", icon: CalendarCheck },
    ],
  },
  {
    title: "Locations & ventes",
    items: [
      { href: "/owner/rentals", label: "Locations en cours", icon: HandCoins },
      { href: "/owner/tenants", label: "Mes locataires", icon: Users },
      { href: "/owner/offers", label: "Offres d'achat", icon: Tag },
      { href: "/contracts", label: "Contrats", icon: FileText },
      { href: "/contracts/templates", label: "Modèles de contrat", icon: FileText },
    ],
  },
  {
    title: "Finances",
    items: [
      { href: "/owner/payments", label: "Paiements", icon: CreditCard },
      { href: "/owner/wallet", label: "Wallet & retraits", icon: Wallet },
      { href: "/owner/finance", label: "Finance & compta", icon: Receipt },
    ],
  },
  {
    title: "Pilotage",
    items: [
      { href: "/owner/analytics", label: "Statistiques", icon: BarChart3 },
      { href: "/owner/reports", label: "Rapports", icon: ClipboardList },
      { href: "/owner/reviews", label: "Évaluations", icon: Star },
      { href: "/owner/documents", label: "Documents", icon: FileText },
    ],
  },
];

const tenantNav: NavGroup[] = [
  {
    title: "Recherche & suivi",
    items: [
      { href: "/tenant/saved", label: "Favoris", icon: Heart },
      { href: "/tenant/visits", label: "Mes visites", icon: CalendarCheck },
      { href: "/tenant/applications", label: "Mes candidatures", icon: ClipboardList },
    ],
  },
  {
    title: "Ma location",
    items: [
      { href: "/tenant/rentals", label: "Mes locations", icon: Home },
      { href: "/contracts", label: "Contrats", icon: FileText },
      { href: "/tenant/documents", label: "Mon dossier", icon: FileText },
    ],
  },
  {
    title: "Finances",
    items: [
      { href: "/tenant/wallet", label: "Portefeuille", icon: Wallet },
      { href: "/tenant/payments", label: "Historique paiements", icon: CreditCard },
      { href: "/tenant/escrow", label: "Fonds en escrow", icon: ShieldCheck },
      { href: "/tenant/finance", label: "Mes finances", icon: Receipt },
    ],
  },
  {
    title: "Plus",
    items: [
      { href: "/buyer", label: "Espace acheteur", icon: Tag },
      { href: "/tenant/messages", label: "Messages", icon: MessageSquare },
      { href: "/tenant/reviews", label: "Mes évaluations", icon: Star },
      { href: "/tenant/analytics", label: "Mes analyses", icon: BarChart3 },
    ],
  },
];

const studentNav: NavGroup[] = [
  {
    title: "Logement",
    items: [
      { href: "/search", label: "Rechercher un logement", icon: Building2 },
      { href: "/tenant/saved", label: "Logements sauvegardés", icon: Heart },
      { href: "/tenant/visits", label: "Mes visites", icon: CalendarCheck },
      { href: "/tenant/applications", label: "Mes candidatures", icon: ClipboardList },
      { href: "/tenant/rentals", label: "Mes locations", icon: Home },
      { href: "/buyer", label: "Espace acheteur", icon: Tag },
    ],
  },
  {
    title: "Colocation",
    items: [
      { href: "/student/colocations", label: "Mes colocations", icon: Users },
      { href: "/student/roommate-matching", label: "Trouver un coloc", icon: Search },
      { href: "/student/matches", label: "Mes matchs", icon: Heart },
      { href: "/student/profile-coloc", label: "Profil coloc", icon: Users },
      { href: "/student/chat", label: "Chat colocataires", icon: MessagesSquare },
    ],
  },
  {
    title: "Vie étudiante",
    items: [
      { href: "/student/budget", label: "Budget", icon: Wallet },
      { href: "/student/expenses", label: "Frais partagés", icon: Receipt },
      { href: "/student/courses", label: "Université", icon: GraduationCap },
      { href: "/student/requests", label: "Demandes", icon: ClipboardList },
    ],
  },
  {
    title: "Suivi",
    items: [
      { href: "/student/finance", label: "Mes finances", icon: Wallet },
      { href: "/student/analytics", label: "Mes analyses", icon: BarChart3 },
      { href: "/student/reports", label: "Rapports", icon: ClipboardList },
    ],
  },
];

const agencyNav: NavGroup[] = [
  {
    title: "Biens & mandats",
    items: [
      { href: "/agency/portfolio", label: "Portefeuille", icon: Building2 },
      { href: "/owner/properties", label: "Mes annonces", icon: Home },
      { href: "/agency/mandates", label: "Mandats", icon: Handshake },
    ],
  },
  {
    title: "Demandes & visites",
    items: [
      { href: "/owner/applications", label: "Candidatures", icon: ClipboardList },
      { href: "/agency/visits", label: "Visites", icon: CalendarCheck },
    ],
  },
  {
    title: "Locations & ventes",
    items: [
      { href: "/agency/rentals", label: "Baux & locations", icon: HandCoins },
      { href: "/owner/offers", label: "Offres d'achat", icon: Tag },
      { href: "/agency/tenants", label: "Locataires", icon: Users },
      { href: "/contracts", label: "Contrats", icon: FileText },
      { href: "/contracts/templates", label: "Modèles de contrat", icon: FileText },
    ],
  },
  {
    title: "Finances",
    items: [
      { href: "/agency/payments", label: "Loyers & encaissements", icon: Receipt },
      { href: "/agency/statement", label: "Relevé de gestion", icon: Receipt },
      { href: "/agency/commissions", label: "Commissions", icon: Coins },
      { href: "/agency/wallet", label: "Wallet & retraits", icon: Wallet },
      { href: "/agency/billing", label: "Facturation", icon: CreditCard },
    ],
  },
  {
    title: "Équipe & relation",
    items: [
      { href: "/agency/team", label: "Équipe", icon: Users },
      { href: "/agency/calendar", label: "Agenda équipe", icon: CalendarCheck },
      { href: "/agency/leads", label: "Leads & CRM", icon: HandCoins },
      { href: "/messages", label: "Messagerie", icon: MessageSquare },
      { href: "/agency/reviews", label: "Évaluations", icon: Star },
      { href: "/agency/disputes", label: "Litiges", icon: AlertOctagon },
      { href: "/agency/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    title: "Pilotage & outils",
    items: [
      { href: "/agency/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/agency/reports", label: "Rapports", icon: ClipboardList },
      { href: "/developers", label: "API & Développeurs", icon: Code2 },
      { href: "/agency/settings", label: "Paramètres agence", icon: Settings },
    ],
  },
];

const buyerNav: NavGroup[] = [
  {
    title: "Recherche",
    items: [
      { href: "/search?listingType=SALE", label: "Biens à vendre", icon: Search },
      { href: "/tenant/saved", label: "Favoris", icon: Heart },
      { href: "/tenant/visits", label: "Mes visites", icon: CalendarCheck },
    ],
  },
  {
    title: "Mes achats",
    items: [
      { href: "/buyer/offers", label: "Mes offres d'achat", icon: Tag },
    ],
  },
  {
    title: "Compte",
    items: [
      { href: "/tenant/wallet", label: "Portefeuille", icon: Wallet },
      { href: "/messages", label: "Messagerie", icon: MessageSquare },
    ],
  },
];

// Filet de sécurité : si un admin atterrit sur une route partagée du groupe
// (dashboard) (ex. /messages, /wallet), il voit une nav admin et non celle du
// propriétaire. L'espace admin principal reste /admin (coquille AdminShell).
const adminNav: NavGroup[] = [
  {
    title: "Supervision",
    items: [
      { href: "/admin/users", label: "Utilisateurs", icon: Users },
      { href: "/admin/properties", label: "Annonces", icon: FileText },
      { href: "/admin/verifications", label: "Vérifications KYC", icon: ShieldCheck },
    ],
  },
  {
    title: "Finances",
    items: [
      { href: "/admin/payments", label: "Paiements", icon: CreditCard },
      { href: "/admin/finance", label: "Finance", icon: Wallet },
    ],
  },
  {
    title: "Système",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
      { href: "/developers", label: "API & Développeurs", icon: Code2 },
    ],
  },
];

const developerNav: NavGroup[] = [
  {
    title: "Développeur",
    items: [
      { href: "/developers", label: "API & Développeurs", icon: Code2 },
      { href: "/messages", label: "Messagerie", icon: MessageSquare },
    ],
  },
];

const roleNavMap: Record<string, NavGroup[]> = {
  OWNER: ownerNav,
  TENANT: tenantNav,
  STUDENT: studentNav,
  AGENCY: agencyNav,
  BUYER: buyerNav,
  DEVELOPER: developerNav,
  ADMIN: adminNav,
};

/** Cible du lien « Vue d'ensemble » selon le rôle. */
const OVERVIEW_HREF: Record<string, string> = {
  OWNER: "/dashboard",
  TENANT: "/dashboard",
  STUDENT: "/dashboard",
  AGENCY: "/agency",
  BUYER: "/buyer",
  DEVELOPER: "/developers",
  ADMIN: "/admin",
};

interface SidebarProps {
  role?: string;
  className?: string;
}

export function Sidebar({ role = "OWNER", className }: SidebarProps) {
  const pathname = usePathname();
  const navGroups = roleNavMap[role] || ownerNav;
  const overviewHref = OVERVIEW_HREF[role] ?? "/dashboard";

  return (
    <aside
      className={cn(
        "flex w-[280px] flex-col border-r border-border bg-white",
        className
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* Vue d'ensemble : lien vers le tableau de bord du rôle, toujours en
            tête de menu (hors catégories). */}
        <Link
          href={overviewHref}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === overviewHref
              ? "bg-kaza-navy text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <LayoutDashboard className="size-5" />
          Vue d&apos;ensemble
        </Link>

        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.title}
            </p>
            {group.items.map((item) => {
              const base = item.href.split("?")[0];
              const isActive =
                pathname === base || pathname.startsWith(`${base}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-kaza-navy text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Compte : lié à la navigation (défile avec le reste, plus fixé en
            bas). Séparé visuellement par un filet supérieur. */}
        <div className="space-y-1 border-t border-border pt-4">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Compte
          </p>
          <Link
            href="/notifications"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/notifications")
                ? "bg-kaza-navy text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Bell className="size-5" />
            Notifications
          </Link>
          <Link
            href="/verify-identity"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/verify-identity")
                ? "bg-kaza-navy text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ShieldCheck className="size-5" />
            Vérifier mon identité
          </Link>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-kaza-navy text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="size-5" />
            Paramètres
          </Link>
        </div>
      </nav>
    </aside>
  );
}
