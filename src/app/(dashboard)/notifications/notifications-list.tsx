"use client";

import { useMemo, useState, useTransition } from "react";
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

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

// Aligne sur l'ENUM notification_type (migration 00004).
type DbNotificationType =
  | "visit_request"
  | "visit_accepted"
  | "visit_rejected"
  | "message_received"
  | "payment_received"
  | "payment_failed"
  | "payment_due"
  | "property_approved"
  | "property_rejected"
  | "property_suspended"
  | "contract_ready"
  | "contract_signed"
  | "review_received"
  | "identity_approved"
  | "identity_rejected"
  | "system";

interface Notification {
  id: string;
  type: DbNotificationType;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

// Mapping ENUM Postgres -> presentation visuelle
type VisualCategory =
  | "payment"
  | "visit"
  | "message"
  | "listing"
  | "contract"
  | "review"
  | "system";

function toVisual(type: DbNotificationType): VisualCategory {
  if (type.startsWith("payment_")) return "payment";
  if (type.startsWith("visit_")) return "visit";
  if (type === "message_received") return "message";
  if (type.startsWith("property_")) return "listing";
  if (type.startsWith("contract_")) return "contract";
  if (type === "review_received") return "review";
  return "system";
}

const ICONS: Record<VisualCategory, LucideIcon> = {
  payment: CreditCard,
  visit: CalendarCheck,
  message: MessageSquare,
  listing: CheckCircle2,
  contract: FileText,
  review: Star,
  system: TriangleAlert,
};

const ICON_COLORS: Record<VisualCategory, string> = {
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

type TabKey = "all" | "unread" | "payments" | "visits" | "messages";

const TAB_FILTERS: Record<TabKey, (n: Notification) => boolean> = {
  all: () => true,
  unread: (n) => !n.isRead,
  payments: (n) => toVisual(n.type) === "payment",
  visits: (n) => toVisual(n.type) === "visit",
  messages: (n) => toVisual(n.type) === "message",
};

interface NotificationsListProps {
  initialNotifications: Notification[];
}

export function NotificationsList({
  initialNotifications,
}: NotificationsListProps) {
  const [items, setItems] = useState<Notification[]>(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const unreadCount = useMemo(
    () => items.filter((n) => !n.isRead).length,
    [items],
  );

  function markAllAsRead() {
    if (unreadCount === 0) return;
    // Optimistic update
    const previous = items;
    setItems((curr) => curr.map((n) => ({ ...n, isRead: true })));
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (!result.success) {
        setItems(previous);
        toast.error(result.error || "Echec de la mise a jour");
        return;
      }
      toast.success("Toutes les notifications sont marquées comme lues");
    });
  }

  function markOneAsRead(id: string) {
    const target = items.find((n) => n.id === id);
    if (!target || target.isRead) return;
    // Optimistic update
    const previous = items;
    setItems((curr) =>
      curr.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    void markNotificationRead(id).then((result) => {
      if (!result.success) {
        setItems(previous);
        toast.error(result.error || "Echec de la mise a jour");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-muted-foreground">
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
          disabled={unreadCount === 0 || isPending}
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
                      title="Pas encore de notifications"
                      description="Vous serez prévenu pour chaque visite, message ou paiement."
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
  const visual = toVisual(notification.type);
  const Icon = ICONS[visual];

  const content = (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50",
        !notification.isRead && "border-kaza-blue/30 bg-kaza-blue/[0.03]",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          ICON_COLORS[visual],
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="inline-flex h-2 w-2 rounded-full bg-kaza-blue" />
          )}
        </div>
        {notification.body ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {notification.body}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
    </div>
  );

  return (
    <li>
      {notification.link ? (
        <Link
          href={notification.link}
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
