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

const ownerNav: NavItem[] = [
  { href: "/owner/properties", label: "Mes Propriétés", icon: Building2 },
  { href: "/owner/visits", label: "Demandes de Visite", icon: CalendarCheck },
  { href: "/owner/applications", label: "Candidatures", icon: ClipboardList },
  { href: "/owner/calendar", label: "Calendrier", icon: CalendarCheck },
  { href: "/owner/rentals", label: "Locations en Cours", icon: HandCoins },
  { href: "/owner/offers", label: "Offres d'achat", icon: Tag },
  { href: "/owner/tenants", label: "Mes Locataires", icon: Users },
  { href: "/owner/payments", label: "Paiements", icon: CreditCard },
  { href: "/owner/wallet", label: "Wallet & retraits", icon: Wallet },
  { href: "/owner/finance", label: "Finance & compta", icon: Wallet },
  { href: "/owner/reviews", label: "Évaluations", icon: BarChart3 },
  { href: "/owner/analytics", label: "Statistiques", icon: BarChart3 },
  { href: "/owner/documents", label: "Documents", icon: FileText },
  { href: "/owner/reports", label: "Rapports", icon: ClipboardList },
  { href: "/owner/promotion", label: "Booster une annonce", icon: TrendingUp },
  { href: "/contracts", label: "Contrats", icon: FileText },
  { href: "/contracts/templates", label: "Modèles contrats", icon: FileText },
];

const tenantNav: NavItem[] = [
  { href: "/tenant/saved", label: "Propriétés Sauvegardées", icon: Heart },
  { href: "/tenant/visits", label: "Mes Visites", icon: CalendarCheck },
  { href: "/tenant/applications", label: "Mes Candidatures", icon: ClipboardList },
  { href: "/tenant/rentals", label: "Mes Locations", icon: Home },
  { href: "/buyer", label: "Espace acheteur", icon: Tag },
  { href: "/tenant/wallet", label: "Portefeuille", icon: Wallet },
  { href: "/tenant/payments", label: "Historique Paiements", icon: CreditCard },
  { href: "/tenant/analytics", label: "Mes analyses", icon: BarChart3 },
  { href: "/tenant/finance", label: "Mes finances", icon: Wallet },
  { href: "/tenant/escrow", label: "Fonds en escrow", icon: ShieldCheck },
  { href: "/tenant/documents", label: "Mon Dossier", icon: FileText },
  { href: "/tenant/reviews", label: "Mes Évaluations", icon: BarChart3 },
  { href: "/tenant/messages", label: "Messages", icon: MessageSquare },
  { href: "/contracts", label: "Contrats", icon: FileText },
];

const studentNav: NavItem[] = [
  // — Louer un logement (tous les étudiants ne cherchent pas une coloc) —
  { href: "/search", label: "Rechercher un logement", icon: Building2 },
  { href: "/tenant/saved", label: "Logements sauvegardés", icon: Heart },
  { href: "/tenant/visits", label: "Mes visites", icon: CalendarCheck },
  { href: "/tenant/applications", label: "Mes candidatures", icon: ClipboardList },
  { href: "/tenant/rentals", label: "Mes locations", icon: Home },
  { href: "/buyer", label: "Espace acheteur", icon: Tag },
  // — Colocation —
  { href: "/student/colocations", label: "Mes Colocations", icon: Users },
  { href: "/student/roommate-matching", label: "Trouver un coloc", icon: Search },
  { href: "/student/matches", label: "Mes Matchs", icon: Heart },
  { href: "/student/profile-coloc", label: "Profil Coloc", icon: Users },
  { href: "/student/budget", label: "Budget", icon: Wallet },
  { href: "/student/finance", label: "Mes finances", icon: Wallet },
  { href: "/student/analytics", label: "Mes analyses", icon: BarChart3 },
  { href: "/student/courses", label: "Université", icon: GraduationCap },
  { href: "/student/requests", label: "Demandes", icon: ClipboardList },
  { href: "/student/expenses", label: "Frais Partagés", icon: Receipt },
  { href: "/student/reports", label: "Rapports", icon: ClipboardList },
  { href: "/student/chat", label: "Chat Colocataires", icon: MessagesSquare },
];

const agencyNav: NavItem[] = [
  { href: "/agency", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/agency/portfolio", label: "Portefeuille", icon: Building2 },
  { href: "/owner/properties", label: "Mes annonces", icon: Home },
  { href: "/agency/tenants", label: "Locataires", icon: Users },
  { href: "/owner/applications", label: "Candidatures", icon: ClipboardList },
  { href: "/agency/rentals", label: "Baux & locations", icon: HandCoins },
  { href: "/owner/offers", label: "Offres d'achat", icon: Tag },
  { href: "/agency/visits", label: "Visites", icon: CalendarCheck },
  { href: "/agency/payments", label: "Loyers & encaissements", icon: Receipt },
  { href: "/agency/reviews", label: "Évaluations", icon: Star },
  { href: "/agency/mandates", label: "Mandats", icon: Handshake },
  { href: "/agency/commissions", label: "Commissions", icon: Coins },
  { href: "/agency/disputes", label: "Litiges", icon: AlertOctagon },
  { href: "/agency/documents", label: "Documents", icon: FileText },
  { href: "/messages", label: "Messagerie", icon: MessageSquare },
  { href: "/agency/leads", label: "Leads & CRM", icon: HandCoins },
  { href: "/agency/team", label: "Équipe", icon: Users },
  { href: "/agency/calendar", label: "Agenda équipe", icon: CalendarCheck },
  { href: "/agency/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/agency/reports", label: "Rapports", icon: ClipboardList },
  { href: "/agency/billing", label: "Facturation", icon: CreditCard },
  { href: "/agency/wallet", label: "Wallet & retraits", icon: Wallet },
  { href: "/contracts", label: "Contrats", icon: FileText },
  { href: "/contracts/templates", label: "Modèles contrats", icon: FileText },
  { href: "/agency/settings", label: "Paramètres agence", icon: Settings },
];

const buyerNav: NavItem[] = [
  { href: "/buyer", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/search?listingType=SALE", label: "Biens à vendre", icon: Search },
  { href: "/buyer/offers", label: "Mes offres d'achat", icon: Tag },
  { href: "/tenant/saved", label: "Favoris", icon: Heart },
  { href: "/tenant/visits", label: "Mes visites", icon: CalendarCheck },
  { href: "/tenant/wallet", label: "Portefeuille", icon: Wallet },
  { href: "/messages", label: "Messagerie", icon: MessageSquare },
];

// Filet de sécurité : si un admin atterrit sur une route partagée du groupe
// (dashboard) (ex. /messages, /wallet), il voit une nav admin et non celle du
// propriétaire. L'espace admin principal reste /admin (coquille AdminShell).
const adminNav: NavItem[] = [
  { href: "/admin", label: "Centre de contrôle", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/properties", label: "Annonces", icon: FileText },
  { href: "/admin/verifications", label: "Vérifications KYC", icon: ShieldCheck },
  { href: "/admin/payments", label: "Paiements", icon: CreditCard },
  { href: "/admin/finance", label: "Finance", icon: Wallet },
  { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
];

const roleNavMap: Record<string, NavItem[]> = {
  OWNER: ownerNav,
  TENANT: tenantNav,
  STUDENT: studentNav,
  AGENCY: agencyNav,
  BUYER: buyerNav,
  ADMIN: adminNav,
};

interface SidebarProps {
  role?: string;
  className?: string;
}

export function Sidebar({ role = "OWNER", className }: SidebarProps) {
  const pathname = usePathname();
  const navItems = roleNavMap[role] || ownerNav;

  return (
    <aside
      className={cn(
        "flex w-[280px] flex-col border-r border-border bg-white",
        className
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {/* Vue d'ensemble : on n'affiche le lien générique /dashboard que pour
            les rôles qui n'ont pas leur propre "Vue d'ensemble" en tête de
            menu (évite le doublon visible chez AGENCY notamment). */}
        {!navItems.some((i) => /vue d.ensemble/i.test(i.label)) && (
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/dashboard"
                ? "bg-kaza-navy text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <LayoutDashboard className="size-5" />
            Vue d&apos;ensemble
          </Link>
        )}

        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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
      </nav>

      {/* Bottom section */}
      <div className="space-y-1 border-t p-4">
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
    </aside>
  );
}
