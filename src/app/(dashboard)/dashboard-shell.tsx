"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
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
import { getInitials } from "@/lib/utils";
import { logout } from "@/actions/auth";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  TENANT: "Locataire",
  STUDENT: "Étudiant",
  AGENCY: "Agence immobilière",
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
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = "kaza:sidebar-collapsed";

export function DashboardShell({ user, children }: DashboardShellProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  // Sidebar collapse state — persisté en localStorage. Vrai = sidebar masquée.
  const [collapsed, setCollapsed] = useState(false);

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
              KAZA
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

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              asChild
            >
              <Link href="/notifications">
                <Bell className="size-5" />
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kaza-blue opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-kaza-blue" />
                </span>
                <span className="sr-only">Notifications</span>
              </Link>
            </Button>

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
                      {user.isDemo ? (
                        <Badge className="border-0 bg-amber-100 text-[10px] text-amber-800">
                          Mode démo
                        </Badge>
                      ) : null}
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
