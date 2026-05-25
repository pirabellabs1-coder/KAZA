"use client";

import { useState } from "react";
import { Search, Send, Phone, MoreVertical, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";

// Static conversation data for placeholder
const conversations = [
  {
    id: "conv-001",
    name: "Amina Koné",
    avatar: null,
    lastMessage:
      "Bonjour M. Leroy, oui l'appartement est toujours disponible.",
    time: "14h30",
    unread: 1,
    online: true,
  },
  {
    id: "conv-002",
    name: "Jean Dupont",
    avatar: null,
    lastMessage:
      "Je peux vous proposer la chambre meublée à Ganhi.",
    time: "11h30",
    unread: 0,
    online: false,
  },
  {
    id: "conv-003",
    name: "Fatou Diallo",
    avatar: null,
    lastMessage: "Merci beaucoup pour les informations !",
    time: "Hier",
    unread: 0,
    online: true,
  },
];

const activeMessages = [
  {
    id: "m-1",
    sender: "me",
    text: "Bonjour Mme Koné, je suis intéressé par votre appartement à Cadjehoun. Est-il encore disponible ?",
    time: "14h00",
  },
  {
    id: "m-2",
    sender: "other",
    text: "Bonjour M. Leroy, oui l'appartement est toujours disponible. Vous pouvez venir le visiter demain matin à 10h si cela vous convient. L'adresse exacte est au croisement Cadjehoun, en face de la pharmacie Sainte Rita.",
    time: "14h30",
  },
  {
    id: "m-3",
    sender: "me",
    text: "Parfait, je serai là demain à 10h. Merci beaucoup !",
    time: "14h45",
  },
];

export function MessagesView() {
  const [selectedConversation, setSelectedConversation] = useState(
    conversations[0]
  );
  const [showConversation, setShowConversation] = useState(false);
  const [messageInput, setMessageInput] = useState("");

  const handleSelectConversation = (conv: (typeof conversations)[0]) => {
    setSelectedConversation(conv);
    setShowConversation(true);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border bg-card">
      {/* Conversation list sidebar */}
      <div
        className={cn(
          "w-full flex-col border-r md:flex md:w-80 lg:w-96",
          showConversation ? "hidden" : "flex"
        )}
      >
        <div className="border-b p-4">
          <h2 className="font-heading text-lg font-bold">Messages</h2>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une conversation..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              className={cn(
                "flex w-full items-center gap-3 border-b p-4 text-left transition-colors hover:bg-muted/50",
                selectedConversation.id === conv.id && "bg-muted/50"
              )}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={conv.avatar} alt={conv.name} />
                  <AvatarFallback className="bg-kaza-navy text-white text-xs">
                    {getInitials(
                      conv.name.split(" ")[0],
                      conv.name.split(" ")[1] || ""
                    )}
                  </AvatarFallback>
                </Avatar>
                {conv.online && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-kaza-green" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium">{conv.name}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {conv.time}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unread > 0 && (
                <Badge className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-kaza-blue p-0 text-[10px] text-white">
                  {conv.unread}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div
        className={cn(
          "flex-1 flex-col",
          showConversation ? "flex" : "hidden md:flex"
        )}
      >
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b p-4">
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                onClick={() => setShowConversation(false)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Avatar>
                <AvatarImage
                  src={selectedConversation.avatar}
                  alt={selectedConversation.name}
                />
                <AvatarFallback className="bg-kaza-navy text-white text-xs">
                  {getInitials(
                    selectedConversation.name.split(" ")[0],
                    selectedConversation.name.split(" ")[1] || ""
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {selectedConversation.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.online ? "En ligne" : "Hors ligne"}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm">
                <Phone className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="size-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender === "me" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5",
                      msg.sender === "me"
                        ? "bg-kaza-navy text-white"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        msg.sender === "me"
                          ? "text-white/60"
                          : "text-muted-foreground"
                      )}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Écrire un message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      // Placeholder: send message
                      setMessageInput("");
                    }
                  }}
                  className="flex-1"
                />
                <Button size="icon" className="shrink-0">
                  <Send className="size-4" />
                  <span className="sr-only">Envoyer</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Sélectionnez une conversation pour commencer
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
