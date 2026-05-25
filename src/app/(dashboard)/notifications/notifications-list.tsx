"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  CheckCircle2,
  CreditCard,
  FileText,
  MessageSquare,
  Star,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

type NotificationType =
  | "payment"
  | "visit"
  | "message"
  | "listing"
  | "contract"
  | "review"
  | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string; // ISO
  read: boolean;
  href?: string;
}

const ICONS: Record<NotificationType, LucideIcon> = {
  payment: CreditCard,
  visit: CalendarCheck,
  message: MessageSquare,
  listing: CheckCircle2,
  contract: FileText,
  review: Star,
  system: TriangleAlert,
};

const ICON_COLORS: Record<NotificationType, string> = {
  payment: "bg-kaza-green/10 text-kaza-green",
  visit: "bg-kaza-blue/10 text-kaza-blue",
  message: "bg-kaza-navy/10 text-kaza-navy",
  listing: "bg-kaza-green/10 text-kaza-green",
  contract: "bg-kaza-navy/10 text-kaza-navy",
  review: "bg-kaza-warning/10 text-kaza-warning",
  system: "bg-kaza-error/10 text-kaza-error",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `il y a ${d} j`;
  const w = Math.round(d / 7);
  if (w < 4) return `il y a ${w} sem`;
  const mo = Math.round(d / 30);
  return `il y a ${mo} mois`;
}

const now = Date.now();
const ago = (ms: number) => new Date(now - ms).toISOString();

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n-001",
    type: "payment",
    title: "Paiement reçu",
    description:
      "Thomas Adjovi a payé 150 000 FCFA pour Appartement Fidjrosse — Juin 2026.",
    createdAt: ago(1000 * 60 * 12),
    read: false,
    href: "/owner/payments",
  },
  {
    id: "n-002",
    type: "visit",
    title: "Nouvelle demande de visite",
    description:
      "Aïcha souhaite visiter votre Villa Calavi le 28 mai à 16h00.",
    createdAt: ago(1000 * 60 * 45),
    read: false,
    href: "/owner/visits",
  },
  {
    id: "n-003",
    type: "message",
    title: "Nouveau message de Marie",
    description:
      "« Bonjour, est-ce que l'appartement est encore disponible pour juillet ? »",
    createdAt: ago(1000 * 60 * 60 * 2),
    read: false,
    href: "/messages/conv-001",
  },
  {
    id: "n-004",
    type: "listing",
    title: "Annonce approuvée",
    description:
      "Votre annonce Studio meublé Akpakpa a été validée et est désormais visible.",
    createdAt: ago(1000 * 60 * 60 * 5),
    read: false,
    href: "/owner/properties",
  },
  {
    id: "n-005",
    type: "contract",
    title: "Contrat signé",
    description:
      "Le contrat de location avec Fatou Diallo est désormais signé électroniquement.",
    createdAt: ago(1000 * 60 * 60 * 8),
    read: true,
    href: "/owner/rentals",
  },
  {
    id: "n-006",
    type: "review",
    title: "Nouvelle évaluation 5★",
    description:
      "Kossi a laissé un avis 5 étoiles sur votre Maison de Cocotomey.",
    createdAt: ago(1000 * 60 * 60 * 24),
    read: true,
    href: "/owner/reviews",
  },
  {
    id: "n-007",
    type: "payment",
    title: "Paiement en attente",
    description:
      "Le paiement de 200 000 FCFA pour Villa Calavi est en cours de vérification.",
    createdAt: ago(1000 * 60 * 60 * 26),
    read: true,
    href: "/owner/payments",
  },
  {
    id: "n-008",
    type: "visit",
    title: "Visite confirmée",
    description:
      "Votre visite de l'Appartement Ganhi est confirmée pour demain à 10h.",
    createdAt: ago(1000 * 60 * 60 * 30),
    read: false,
    href: "/tenant/rentals",
  },
  {
    id: "n-009",
    type: "message",
    title: "Réponse de Jean Dupont",
    description:
      "« Oui le studio est libre, je peux vous le faire visiter samedi. »",
    createdAt: ago(1000 * 60 * 60 * 36),
    read: true,
    href: "/messages/conv-002",
  },
  {
    id: "n-010",
    type: "system",
    title: "Vérification d'identité requise",
    description:
      "Téléchargez votre CNI pour finaliser la vérification de votre compte.",
    createdAt: ago(1000 * 60 * 60 * 48),
    read: false,
    href: "/profile",
  },
  {
    id: "n-011",
    type: "payment",
    title: "Reçu disponible",
    description:
      "Votre reçu de paiement pour Mai 2026 est prêt à être téléchargé.",
    createdAt: ago(1000 * 60 * 60 * 72),
    read: true,
    href: "/tenant/payments",
  },
  {
    id: "n-012",
    type: "listing",
    title: "Annonce expirée",
    description:
      "Votre annonce Chambre étudiante UAC est expirée. Renouvelez-la pour rester visible.",
    createdAt: ago(1000 * 60 * 60 * 96),
    read: true,
    href: "/owner/properties",
  },
  {
    id: "n-013",
    type: "visit",
    title: "Rappel : visite demain",
    description:
      "Rappel — votre visite Villa Akpakpa avec Mamadou est prévue demain à 15h.",
    createdAt: ago(1000 * 60 * 60 * 100),
    read: false,
    href: "/owner/visits",
  },
  {
    id: "n-014",
    type: "contract",
    title: "Action requise sur un contrat",
    description:
      "Veuillez signer le contrat de location pour le studio Cadjèhoun.",
    createdAt: ago(1000 * 60 * 60 * 120),
    read: false,
    href: "/tenant/rentals",
  },
];

type TabKey = "all" | "unread" | "payments" | "visits" | "messages";

const TAB_FILTERS: Record<TabKey, (n: Notification) => boolean> = {
  all: () => true,
  unread: (n) => !n.read,
  payments: (n) => n.type === "payment",
  visits: (n) => n.type === "visit",
  messages: (n) => n.type === "message",
};

export function NotificationsList() {
  const [items, setItems] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  function markAllAsRead() {
    setItems((curr) => curr.map((n) => ({ ...n, read: true })));
  }

  function markOneAsRead(id: string) {
    setItems((curr) =>
      curr.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${
                  unreadCount > 1 ? "s" : ""
                }`
              : "Vous êtes à jour."}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="size-4" />
          Tout marquer comme lu
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full max-w-2xl overflow-x-auto">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="unread">
            Non lues
            {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-kaza-blue px-1 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="visits">Visites</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        {(Object.keys(TAB_FILTERS) as TabKey[]).map((key) => {
          const filtered = items.filter(TAB_FILTERS[key]);
          return (
            <TabsContent key={key} value={key} className="mt-4">
              {filtered.length === 0 ? (
                <Card>
                  <CardContent className="py-2">
                    <EmptyState
                      icon={Bell}
                      title="Pas de notifications"
                      description="Vous serez notifié(e) ici dès qu'une activité concernera votre compte."
                    />
                  </CardContent>
                </Card>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onRead={() => markOneAsRead(n.id)}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const Icon = ICONS[notification.type];

  const content = (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50",
        !notification.read && "border-kaza-blue/30 bg-kaza-blue/[0.03]"
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          ICON_COLORS[notification.type]
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">
            {notification.title}
          </p>
          {!notification.read && (
            <span className="inline-flex h-2 w-2 rounded-full bg-kaza-blue" />
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {notification.description}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
    </div>
  );

  return (
    <li>
      {notification.href ? (
        <Link
          href={notification.href}
          onClick={onRead}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onRead}
          className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        >
          {content}
        </button>
      )}
    </li>
  );
}
