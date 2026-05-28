"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  AlertOctagon,
  Settings,
  LogOut,
  CreditCard,
  TrendingUp,
  Receipt,
  ShieldAlert,
  Mail,
  ToggleRight,
  FileText,
  FolderArchive,
  Activity,
  Wallet,
  ScrollText,
  Megaphone,
  Briefcase,
  Gavel,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const adminNavSections: NavSection[] = [
  {
    items: [
      { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
      { href: "/admin/monitoring", label: "Monitoring", icon: Activity },
    ],
  },
  {
    label: "Utilisateurs",
    items: [
      { href: "/admin/users", label: "Utilisateurs", icon: Users },
      { href: "/admin/agencies", label: "Agences", icon: Briefcase },
      { href: "/admin/staff", label: "Staff KAZA", icon: Users },
      {
        href: "/admin/verifications",
        label: "Vérifications KYC",
        icon: ShieldCheck,
        badge: 47,
      },
    ],
  },
  {
    label: "Contenu plateforme",
    items: [
      {
        href: "/admin/properties",
        label: "Annonces",
        icon: Building2,
        badge: 12,
      },
      { href: "/admin/contracts", label: "Contrats", icon: FileText },
      { href: "/admin/documents", label: "Documents", icon: FolderArchive },
      { href: "/admin/content", label: "Modération", icon: ShieldAlert },
      {
        href: "/admin/disputes",
        label: "Litiges",
        icon: Gavel,
        badge: 3,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/finance", label: "Finance plateforme", icon: Wallet },
      { href: "/admin/payments", label: "Paiements", icon: CreditCard },
      { href: "/admin/payouts", label: "Demandes retrait", icon: Wallet },
      { href: "/admin/refunds", label: "Remboursements", icon: Receipt },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/admin/notifications", label: "Campagnes", icon: Megaphone },
      { href: "/admin/email-templates", label: "Templates Email", icon: Mail },
    ],
  },
  {
    label: "Conformité",
    items: [
      { href: "/admin/compliance", label: "Conformité RGPD/OHADA", icon: ShieldCheck },
      { href: "/admin/audit-log", label: "Journal d'audit", icon: ScrollText },
    ],
  },
  {
    label: "Système",
    items: [
      { href: "/admin/feature-flags", label: "Feature Flags", icon: ToggleRight },
      { href: "/admin/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

// Suppress unused warnings — icons retained for future entries
void AlertOctagon;

interface AdminSidebarProps {
  className?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onNavigate?: () => void;
}

export function AdminSidebar({
  className,
  user = {
    firstName: "Admin",
    lastName: "KAZA",
    email: "admin@kaza.africa",
  },
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-white",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kaza-navy">
          <span className="text-sm font-bold text-white">K</span>
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-base font-bold leading-tight text-kaza-navy">
            KAZA
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {adminNavSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-1">
            {section.label && (
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-kaza-navy text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="size-5" />
                    {item.label}
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-kaza-blue/10 text-kaza-blue"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User badge */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-kaza-navy text-xs text-white">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">
              {user.firstName} {user.lastName}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {user.email}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              // Placeholder: will integrate with Supabase auth
              window.location.href = "/login";
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white hover:text-kaza-error"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
