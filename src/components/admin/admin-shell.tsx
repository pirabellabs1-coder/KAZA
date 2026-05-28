"use client";

import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";

const SIDEBAR_COLLAPSED_KEY = "kaza:admin-sidebar-collapsed";

interface AdminShellProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  children: React.ReactNode;
}

/**
 * Wrapper client de l'espace ADMIN.
 *
 * Gère :
 * - sidebar desktop collapsible (toggle persisté dans localStorage)
 * - injection d'un bouton "Replier le menu" à gauche du header
 * - mobile : sheet déjà géré dans AdminHeader (burger)
 */
export function AdminShell({ user, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar — masquable via toggle */}
      <div
        className={`hidden h-full transition-[width] duration-200 lg:block ${
          collapsed ? "w-0 overflow-hidden" : "w-[260px]"
        }`}
      >
        <AdminSidebar user={user} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header avec bouton toggle desktop intégré à gauche */}
        <div className="relative">
          <AdminHeader user={user} notificationCount={5} />
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 lg:inline-flex"
            onClick={toggle}
            aria-label={collapsed ? "Ouvrir le menu" : "Fermer le menu"}
            title={collapsed ? "Ouvrir le menu" : "Fermer le menu"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </Button>
        </div>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 lg:pl-12">
          {children}
        </main>
      </div>
    </div>
  );
}
