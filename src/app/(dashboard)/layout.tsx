"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  LogOut,
  User,
  ChevronDown,
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

// Hardcoded mock user for development
const mockUser = {
  id: "u-002-owner-jean",
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean.dupont@gmail.com",
  role: "OWNER" as const,
  profilePhotoUrl: null,
  isVerified: true,
};

const roleLabels: Record<string, string> = {
  OWNER: "Propriétaire",
  TENANT: "Locataire",
  STUDENT: "Étudiant",
  ADMIN: "Administrateur",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:h-full">
        <div className="flex h-16 items-center border-b border-border bg-white px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kaza-navy">
              <span className="text-sm font-bold text-white">K</span>
            </div>
            <span className="font-heading text-xl font-bold text-kaza-navy">
              KAZA
            </span>
          </Link>
        </div>
        <Sidebar role={mockUser.role} className="flex-1 overflow-y-auto" />
      </div>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-white px-4 lg:px-6">
          {/* Mobile nav toggle */}
          <MobileNav role={mockUser.role} />

          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-kaza-navy">
              <span className="text-xs font-bold text-white">K</span>
            </div>
          </Link>

          {/* Search */}
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

          {/* Spacer */}
          <div className="flex-1 md:hidden" />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Mobile search toggle */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="size-5" />
              <span className="sr-only">Rechercher</span>
            </Button>

            {/* Notification bell */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kaza-blue opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-kaza-blue" />
              </span>
              <span className="sr-only">Notifications</span>
            </Button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <Avatar>
                    <AvatarImage
                      src={mockUser.profilePhotoUrl}
                      alt={`${mockUser.firstName} ${mockUser.lastName}`}
                    />
                    <AvatarFallback className="bg-kaza-navy text-white text-xs">
                      {getInitials(mockUser.firstName, mockUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left lg:block">
                    <p className="text-sm font-medium leading-none">
                      {mockUser.firstName} {mockUser.lastName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {roleLabels[mockUser.role]}
                    </p>
                  </div>
                  <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {mockUser.firstName} {mockUser.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mockUser.email}
                    </p>
                    <Badge variant="secondary" className="mt-1 w-fit text-xs">
                      {roleLabels[mockUser.role]}
                    </Badge>
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
                  onClick={() => {
                    // Placeholder: will integrate with Supabase auth
                    window.location.href = "/login";
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Push notification onboarding bottom banner (mount-on-demand) */}
      <PushTokenRegister />
    </div>
  );
}
