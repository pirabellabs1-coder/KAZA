"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { Loader2, Send } from "lucide-react";

import { sendMessageTo } from "@/actions/messages";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageReadIndicator } from "@/components/messaging/message-read-indicator";
import { MessageSearch } from "@/components/messaging/message-search";
import { toast } from "@/components/ui/toast-helper";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface ConversationViewProps {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  propertyId: string | null;
  initialMessages: Message[];
}

interface RawIncomingMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  property_id: string | null;
  content: string;
  created_at: string;
}

export function ConversationView({
  currentUserId,
  otherUserId,
  otherUserName,
  propertyId,
  initialMessages,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ajoute un message en evitant les doublons (id + reconciliation optimistic
  // -> remplacement par la version serveur quand elle arrive via realtime).
  const upsertMessage = useCallback(
    (msg: Message, options: { replaceTempFrom?: string } = {}) => {
      setMessages((prev) => {
        if (options.replaceTempFrom) {
          const tempPrefix = options.replaceTempFrom;
          const filtered = prev.filter((m) => !m.id.startsWith(tempPrefix));
          if (filtered.some((m) => m.id === msg.id)) return filtered;
          return [...filtered, msg];
        }
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    },
    [],
  );

  // ---------------------------------------------------------------
  // Realtime subscription : INSERT sur messages pour cette paire d'utilisateurs
  // ---------------------------------------------------------------
  useEffect(() => {
    const supabase = createClient();

    // Channel filtre cote serveur sur recipient_id = currentUserId (RLS
    // garantit qu'on ne voit que nos propres lignes), puis filtrage cote
    // client sur sender_id = otherUserId pour scoper a la conversation.
    const channel = supabase
      .channel(`messages:${currentUserId}:${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const raw = payload.new as RawIncomingMessage;
          if (raw.sender_id !== otherUserId) return;
          if (propertyId && raw.property_id !== propertyId) return;
          upsertMessage({
            id: raw.id,
            content: raw.content,
            senderId: raw.sender_id,
            createdAt: raw.created_at,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId, propertyId, upsertMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  // Tick toutes les 15s pour rafraichir le statut "delivered" -> "read"
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, []);

  const autoResize = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 128) + "px";
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);

    // Optimistic insert (id temporaire `tmp-...`)
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      content: trimmed,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const result = await sendMessageTo({
      recipientId: otherUserId,
      content: trimmed,
      propertyId: propertyId ?? undefined,
    });
    setSending(false);

    if (!result.success) {
      // Retire le message optimistic en cas d'echec
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error(result.error || "Echec de l'envoi du message");
      // Restaure le contenu pour permettre une nouvelle tentative
      setInput(trimmed);
      return;
    }

    // Remplace le message optimistic par la version serveur (avec vrai id)
    const persisted = result.data;
    if (persisted) {
      upsertMessage(
        {
          id: persisted.id,
          content: persisted.content,
          senderId: persisted.sender_id,
          createdAt: persisted.created_at,
        },
        { replaceTempFrom: "tmp-" },
      );
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const [otherFirst, ...otherRest] = otherUserName.split(" ");

  // Filtrage des messages par contenu (case-insensitive)
  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const hasActiveSearch = searchQuery.trim().length > 0;

  return (
    <>
      {/* Barre de recherche */}
      <div className="border-b border-border bg-white px-3 py-2 sm:px-4">
        <MessageSearch
          onSearch={setSearchQuery}
          placeholder="Rechercher dans la conversation..."
        />
        {hasActiveSearch ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {filteredMessages.length} message
            {filteredMessages.length > 1 ? "s" : ""} sur {messages.length}
          </p>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-gray-50/50 p-4"
      >
        {messages.length === 0 && !hasActiveSearch ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Pas encore de messages
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Écrivez le premier message pour démarrer la conversation.
              </p>
            </div>
          </div>
        ) : null}

        {filteredMessages.length === 0 && hasActiveSearch ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Aucun message ne correspond à « {searchQuery} ».
            </p>
          </div>
        ) : null}

        {filteredMessages.map((m) => {
          const isMine = m.senderId === currentUserId;
          const isOptimistic = m.id.startsWith("tmp-");
          const ageMs = now - new Date(m.createdAt).getTime();
          const readStatus = isOptimistic
            ? "delivered"
            : ageMs > 30_000
              ? "read"
              : "delivered";
          return (
            <div
              key={m.id}
              className={cn(
                "flex items-end gap-2",
                isMine ? "justify-end" : "justify-start",
              )}
            >
              {!isMine ? (
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="bg-kaza-navy text-[10px] text-white">
                    {getInitials(otherFirst ?? "", otherRest.join(" "))}
                  </AvatarFallback>
                </Avatar>
              ) : null}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                  isMine
                    ? "rounded-br-sm bg-kaza-blue text-white"
                    : "rounded-bl-sm bg-white text-foreground",
                  isOptimistic && "opacity-70",
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {m.content}
                </p>
                <div
                  className={cn(
                    "mt-1 flex items-center gap-1.5",
                    isMine ? "justify-end" : "justify-start",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px]",
                      isMine ? "text-white/70" : "text-muted-foreground",
                    )}
                  >
                    {new Date(m.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMine ? (
                    <MessageReadIndicator
                      status={readStatus}
                      className={
                        readStatus === "read" ? "text-white" : "text-white/80"
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border bg-white p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-1.5 transition-colors focus-within:border-kaza-blue">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message..."
            rows={1}
            disabled={sending}
            className="max-h-32 flex-1 resize-none border-0 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSend()}
            disabled={!input.trim() || sending}
            className="shrink-0 bg-kaza-blue hover:bg-kaza-blue/90"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Entrée pour envoyer, Maj+Entrée pour aller à la ligne
        </p>
      </div>
    </>
  );
}
