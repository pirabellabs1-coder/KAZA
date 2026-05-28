import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getConversationPartner,
  listMessagesWith,
  markMessagesRead,
} from "@/lib/queries/messages";
import { getInitials } from "@/lib/utils";

import { ConversationView } from "./conversation-view";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Propriétaire",
  TENANT: "Locataire",
  STUDENT: "Étudiant",
  ADMIN: "Administrateur",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ property?: string }>;
}) {
  const { conversationId: otherUserId } = await params;
  const { property: propertyId } = await searchParams;

  if (!UUID_RE.test(otherUserId)) notFound();

  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");

  const partner = await getConversationPartner(otherUserId);
  if (!partner) notFound();

  const [messages] = await Promise.all([
    listMessagesWith(user.id, otherUserId, propertyId),
    // Marque les messages recus comme lus avant render (fire & forget cote serveur)
    markMessagesRead(user.id, otherUserId),
  ]);

  const fullName = `${partner.firstName} ${partner.lastName}`.trim();
  const roleLabel = ROLE_LABEL[partner.role] ?? "Utilisateur";

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Link
          href="/messages"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar className="size-10">
          {partner.photoUrl ? (
            <AvatarImage src={partner.photoUrl} alt={fullName} />
          ) : null}
          <AvatarFallback className="bg-kaza-navy text-xs text-white">
            {getInitials(partner.firstName, partner.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <Badge className="hidden border-0 bg-green-100 text-[10px] text-green-700 sm:inline-flex">
          Temps réel
        </Badge>
      </div>

      <ConversationView
        currentUserId={user.id}
        otherUserId={otherUserId}
        otherUserName={fullName}
        propertyId={propertyId ?? null}
        initialMessages={messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.sender_id,
          createdAt: m.created_at,
        }))}
      />
    </div>
  );
}
