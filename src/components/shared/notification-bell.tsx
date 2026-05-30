"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getMyNotificationsForBell,
  markNotificationRead,
  markAllNotificationsRead,
  type BellNotification,
} from "@/actions/notifications";

interface NotificationBellProps {
  /** Compte initial passé depuis le serveur (évite un flash à 0). */
  initialUnread?: number;
  className?: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export function NotificationBell({
  initialUnread = 0,
  className,
}: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BellNotification[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<BellNotification | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyNotificationsForBell(8);
      setItems(res.notifications);
      setUnread(res.unreadCount);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charge au montage + toutes les 60s pour garder le badge à jour.
  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  // Recharge quand on ouvre le menu.
  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  async function handleClick(n: BellNotification) {
    if (!n.isRead) {
      await markNotificationRead(n.id);
      setUnread((u) => Math.max(0, u - 1));
      setItems((arr) =>
        arr.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
      );
    }
    setOpen(false);
    // Si la notif pointe vers une page, on y va directement.
    // Sinon on ouvre une popup de lecture avec le contenu complet.
    if (n.link) {
      router.push(n.link);
    } else {
      setSelected({ ...n, isRead: true });
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setUnread(0);
    setItems((arr) => arr.map((x) => ({ ...x, isRead: true })));
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${className ?? ""}`}
          aria-label={`${unread} notifications non lues`}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-kaza-error px-1 text-[10px] font-bold leading-none text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold text-kaza-navy">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-kaza-blue hover:underline"
            >
              <CheckCheck className="size-3.5" />
              Tout marquer lu
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Chargement…
            </p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <Inbox className="size-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucune notification
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`flex w-full gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${
                      n.isRead ? "" : "bg-kaza-blue/5"
                    }`}
                  >
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${
                        n.isRead ? "bg-transparent" : "bg-kaza-blue"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-kaza-navy">
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t px-3 py-2">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block w-full rounded-md py-1.5 text-center text-sm font-medium text-kaza-blue hover:bg-muted/50"
          >
            Voir toutes les notifications
          </Link>
        </div>
      </DropdownMenuContent>

      {/* Popup de lecture (notifs sans lien dédié) */}
      <Dialog
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-kaza-navy">
              {selected?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selected ? timeAgo(selected.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {selected?.body || "Aucun détail supplémentaire."}
          </p>
          <DialogFooter className="gap-2 sm:gap-2">
            {selected?.link && (
              <Button
                onClick={() => {
                  const link = selected.link!;
                  setSelected(null);
                  router.push(link);
                }}
                className="bg-kaza-blue hover:bg-kaza-blue/90"
              >
                Ouvrir
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelected(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
