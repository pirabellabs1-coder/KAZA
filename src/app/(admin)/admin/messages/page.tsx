// =============================================================================
// KAZA — Admin / Messages de contact (liste)
// Server component. Lit `contact_messages` (formulaire public /contact) via
// `listContactMessages`. Le bouton "Marquer comme lu" est délégué à un petit
// composant client (MarkReadButton) qui appelle l'action serveur.
// =============================================================================

import { Mail, MailOpen, Phone } from "lucide-react";

import {
  listContactMessages,
  type ContactMessage,
  type ContactMessageStatus,
} from "@/lib/queries/contact-admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MarkReadButton } from "./mark-read-button";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  NEW: "Nouveau",
  READ: "Lu",
  REPLIED: "Répondu",
  CLOSED: "Clos",
};

const STATUS_CLASSES: Record<ContactMessageStatus, string> = {
  NEW: "bg-kaza-blue/10 text-kaza-blue border-kaza-blue/20",
  READ: "bg-amber-100 text-amber-700 border-amber-200",
  REPLIED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessageCard({ message }: { message: ContactMessage }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-semibold text-kaza-navy">
            {message.fullName}
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <a
              href={`mailto:${message.email}`}
              className="inline-flex items-center gap-1 hover:text-kaza-blue hover:underline"
            >
              <Mail className="size-3.5" />
              {message.email}
            </a>
            {message.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" />
                {message.phone}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-semibold",
              STATUS_CLASSES[message.status],
            )}
          >
            {STATUS_LABELS[message.status]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(message.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-kaza-navy">{message.subject}</p>
        <p className="whitespace-pre-line text-sm text-muted-foreground">
          {message.message}
        </p>
      </div>

      {message.status === "NEW" && (
        <div className="flex justify-end pt-1">
          <MarkReadButton id={message.id} />
        </div>
      )}
    </div>
  );
}

export default async function AdminContactMessagesPage() {
  const messages = await listContactMessages();
  const newCount = messages.filter((m) => m.status === "NEW").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Messages de contact
        </h1>
        <p className="text-sm text-muted-foreground">
          Demandes reçues via le formulaire public{" "}
          <span className="font-medium text-kaza-navy">/contact</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4 text-kaza-blue" />
            {messages.length} message{messages.length > 1 ? "s" : ""} au total
            {newCount > 0 && (
              <Badge
                variant="outline"
                className="ml-1 border-kaza-blue/20 bg-kaza-blue/10 text-xs font-semibold text-kaza-blue"
              >
                {newCount} nouveau{newCount > 1 ? "x" : ""}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-kaza-blue/10">
                <MailOpen className="size-6 text-kaza-blue" />
              </div>
              <p className="text-base font-semibold text-kaza-navy">
                Aucun message de contact
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Les messages envoyés depuis le formulaire de contact public
                apparaîtront ici dès leur réception.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
