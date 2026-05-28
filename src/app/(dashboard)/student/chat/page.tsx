import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Chat Colocataires",
};

const ROOMMATES = [
  {
    id: "coloc-1",
    name: "Mariam Touré",
    role: "Étudiante en médecine",
    online: true,
    lastMessage: "On commande des pizzas ce soir ?",
    unread: 2,
  },
  {
    id: "coloc-2",
    name: "Kofi Mensah",
    role: "Étudiant en informatique",
    online: true,
    lastMessage: "J'ai payé la facture d'eau, je vous envoie le reçu.",
    unread: 0,
  },
  {
    id: "coloc-3",
    name: "Tomé Da Silva",
    role: "Étudiant en droit",
    online: false,
    lastMessage: "Merci pour le ménage du salon !",
    unread: 0,
  },
];

const GROUP_MESSAGES = [
  {
    id: "g-1",
    author: "Mariam Touré",
    content: "Hello la coloc ! On commande des pizzas ce soir ?",
    time: "12:32",
    unread: true,
  },
  {
    id: "g-2",
    author: "Kofi Mensah",
    content: "Carrément ! Margherita pour moi 🍕",
    time: "12:34",
    unread: true,
  },
  {
    id: "g-3",
    author: "Tomé Da Silva",
    content: "OK pour moi, calzone svp 😋",
    time: "12:38",
    unread: false,
  },
];

export default function StudentChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Chat Colocataires
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discutez avec votre coloc en groupe ou en privé.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Liste colocataires */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-kaza-blue" />
              Mes colocataires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {ROOMMATES.map((c) => {
              const [first, ...rest] = c.name.split(" ");
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="relative">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-kaza-navy text-xs text-white">
                        {getInitials(first ?? "", rest.join(" "))}
                      </AvatarFallback>
                    </Avatar>
                    {c.online ? (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-kaza-green" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.lastMessage}
                    </p>
                  </div>
                  {c.unread > 0 ? (
                    <Badge className="size-5 rounded-full bg-kaza-blue p-0 text-[10px]">
                      {c.unread}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Chat groupe */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <MessageSquare className="size-4 text-kaza-blue" />
                Discussion de groupe — Coloc UAC
              </span>
              <Badge className="bg-kaza-green/10 text-[10px] text-kaza-green">
                4 membres
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {GROUP_MESSAGES.map((m) => {
                const [first, ...rest] = m.author.split(" ");
                return (
                  <div key={m.id} className="flex items-start gap-3">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="bg-kaza-navy text-[10px] text-white">
                        {getInitials(first ?? "", rest.join(" "))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold">
                          {m.author}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {m.time}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-foreground">
                        {m.content}
                      </p>
                    </div>
                  </div>
                );
              })}

              <p className="text-center text-xs text-muted-foreground">
                Le chat de groupe complet sera activé quand votre colocation
                comptera au moins 2 colocataires confirmés.{" "}
                <Link
                  href="/student/roommate-matching"
                  className="font-medium text-kaza-blue hover:underline"
                >
                  Trouver un colocataire →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
