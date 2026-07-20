"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  LogOut,
  User,
  ChevronDown,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PushTokenRegister } from "@/components/shared/push-token-register";
import { NotificationBell } from "@/components/shared/notification-bell";
import { getInitials } from "@/lib/utils";
import { logout } from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  TENANT: "Locataire",
  STUDENT: "Étudiant",
  AGENCY: "Agence immobilière",
  BUYER: "Acheteur",
  ADMIN: "Administrateur",
};

interface DashboardShellProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isDemo: boolean;
  };
  // NotificationBell importé pour la cloche cliquable (dropdown réel).
  /** Nombre réel de notifications non lues, calculé côté serveur. */
  initialUnreadCount?: number;
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = "kaza:sidebar-collapsed";

export function DashboardShell({
  user,
  initialUnreadCount = 0,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  // Sidebar collapse state — persisté en localStorage. Vrai = sidebar masquée.
  const [collapsed, setCollapsed] = useState(false);
  // Compteur de notifications non lues — initialisé côté serveur puis tenu à
  // jour en temps réel via Supabase Realtime (INSERT/UPDATE sur notifications).
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  // Resynchronise si le serveur renvoie un nouveau compte (revalidation/nav).
  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  // Abonnement Realtime : on recompte les non-lues à chaque changement sur
  // la table notifications de l'utilisateur courant (nouvelle notif, lecture).
  useEffect(() => {
    if (!user.id) return;
    const supabase = createClient();

    async function refreshCount() {
      // try/catch : un echec reseau ne doit pas faire planter le shell, on
      // conserve simplement le dernier compteur connu.
      try {
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("read_at", null);
        setUnreadCount(count ?? 0);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
           
          console.error("[dashboard-shell] refreshCount:", err);
        }
      }
    }

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        } as never,
        () => {
          void refreshCount();
        },
      )
      .subscribe((status) => {
        // Gestion d'erreur Realtime : on log les etats degradant sans geler
        // l'UI. Le compteur reste sur sa derniere valeur connue (SSR ou refetch).
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          if (process.env.NODE_ENV !== "production") {
             
            console.error("[dashboard-shell] Realtime notifications:", status);
          }
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user.id]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Desktop Sidebar — masquable via toggle */}
      <div
        className={`hidden h-full flex-col transition-[width] duration-200 lg:flex ${
          collapsed ? "w-0 overflow-hidden" : "w-[280px]"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-border bg-white px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kaza-navy">
              <span className="text-sm font-bold text-white">K</span>
            </div>
            <span className="font-heading text-xl font-bold text-kaza-navy">
              Kaabo
            </span>
          </Link>
        </div>
        <Sidebar role={user.role} className="flex-1 overflow-y-auto" />
      </div>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-white px-4 lg:px-6">
          {/* Toggle sidebar desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Ouvrir la sidebar" : "Fermer la sidebar"}
            title={collapsed ? "Ouvrir le menu" : "Fermer le menu"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </Button>
          <MobileNav role={user.role} />

          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-kaza-navy">
              <span className="text-xs font-bold text-white">K</span>
            </div>
          </Link>

          <div className="relative hidden flex-1 md:block md:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 md:hidden" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="size-5" />
              <span className="sr-only">Rechercher</span>
            </Button>

            <NotificationBell initialUnread={unreadCount} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <Avatar>
                    <AvatarImage
                      src={undefined}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback className="bg-kaza-navy text-xs text-white">
                      {getInitials(user.firstName, user.lastName || " ")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left lg:block">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </p>
                  </div>
                  <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant="secondary" className="w-fit text-xs">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 size-4" />
                    Mon Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleLogout}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 size-4" />
                  )}
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      <PushTokenRegister />
    </div>
  );
}
