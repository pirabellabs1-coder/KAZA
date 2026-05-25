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
  { href: "/owner/rentals", label: "Locations en Cours", icon: HandCoins },
  { href: "/owner/payments", label: "Paiements", icon: CreditCard },
  { href: "/owner/reviews", label: "Évaluations", icon: BarChart3 },
  { href: "/owner/analytics", label: "Statistiques", icon: BarChart3 },
  { href: "/contracts", label: "Contrats", icon: FileText },
];

const tenantNav: NavItem[] = [
  { href: "/tenant/saved", label: "Propriétés Sauvegardées", icon: Heart },
  { href: "/tenant/rentals", label: "Mes Locations", icon: Home },
  { href: "/tenant/wallet", label: "Portefeuille", icon: Wallet },
  { href: "/tenant/payments", label: "Historique Paiements", icon: CreditCard },
  { href: "/tenant/escrow", label: "Fonds en escrow", icon: ShieldCheck },
  { href: "/tenant/messages", label: "Messages", icon: MessageSquare },
  { href: "/contracts", label: "Contrats", icon: FileText },
];

const studentNav: NavItem[] = [
  { href: "/student/colocations", label: "Mes Colocations", icon: Users },
  { href: "/student/roommate-matching", label: "Trouver un coloc", icon: Search },
  { href: "/student/requests", label: "Demandes", icon: ClipboardList },
  { href: "/student/expenses", label: "Frais Partagés", icon: Receipt },
  { href: "/student/chat", label: "Chat Colocataires", icon: MessagesSquare },
];

const roleNavMap: Record<string, NavItem[]> = {
  OWNER: ownerNav,
  TENANT: tenantNav,
  STUDENT: studentNav,
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
