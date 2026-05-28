import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listConversations } from "@/lib/queries/messages";
import { cn, getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Messages",
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Propriétaire",
  TENANT: "Locataire",
  STUDENT: "Étudiant",
  ADMIN: "Administrateur",
};

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return "Hier";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function MessagesPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/messages");

  const conversations = await listConversations(user.id);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h1 className="font-heading text-lg font-bold text-kaza-navy">
            Messages
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {conversations.length === 0
              ? "Aucune conversation"
              : `${conversations.length} conversation${conversations.length > 1 ? "s" : ""}${totalUnread > 0 ? ` — ${totalUnread} non lu${totalUnread > 1 ? "s" : ""}` : ""}`}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <EmptyState
              icon={MessageSquare}
              title="Aucune conversation"
              description="Vos échanges avec propriétaires et locataires apparaîtront ici dès qu'un message sera envoyé."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {conversations.map((conv) => {
              const isUnread = conv.unreadCount > 0;
              const fullName =
                `${conv.otherUserFirstName} ${conv.otherUserLastName}`.trim();
              const roleLabel = ROLE_LABEL[conv.otherUserRole] ?? "Utilisateur";
              // Inclut propertyId pour distinguer conversations multi-annonces
              const href = conv.propertyId
                ? `/messages/${conv.otherUserId}?property=${conv.propertyId}`
                : `/messages/${conv.otherUserId}`;
              return (
                <li key={`${conv.otherUserId}-${conv.propertyId ?? "none"}`}>
                  <Link
                    href={href}
                    className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-muted/40"
                  >
                    <Avatar className="size-11 shrink-0">
                      {conv.otherUserPhotoUrl ? (
                        <AvatarImage
                          src={conv.otherUserPhotoUrl}
                          alt={fullName}
                        />
                      ) : null}
                      <AvatarFallback className="bg-kaza-navy text-xs text-white">
                        {getInitials(
                          conv.otherUserFirstName,
                          conv.otherUserLastName,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            isUnread
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground",
                          )}
                        >
                          {fullName}
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            · {roleLabel}
                          </span>
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatRelative(conv.lastMessageAt)}
                        </span>
                      </div>
                      {conv.propertyTitle ? (
                        <p className="mt-0.5 truncate text-[11px] font-medium text-kaza-blue">
                          {conv.propertyTitle}
                        </p>
                      ) : null}
                      <p
                        className={cn(
                          "mt-0.5 truncate text-xs",
                          isUnread ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {conv.lastMessage}
                      </p>
                    </div>
                    {isUnread ? (
                      <Badge className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-kaza-blue px-1.5 text-[10px] text-white">
                        {conv.unreadCount}
                      </Badge>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
