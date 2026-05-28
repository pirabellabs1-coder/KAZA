"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, MessageSquare, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";
import { getInitials } from "@/lib/utils";

export interface FlaggedMessage {
  id: string;
  author: string;
  authorEmail: string;
  excerpt: string;
  flagReason: string;
  flaggedBy: string;
  flaggedAt: string;
}

type DialogMode = "delete" | "warn" | null;

interface FlaggedMessagesProps {
  messages: FlaggedMessage[];
}

export function FlaggedMessages({ messages }: FlaggedMessagesProps) {
  const [items, setItems] = useState(messages);
  const [dialog, setDialog] = useState<{ mode: DialogMode; id: string | null }>({
    mode: null,
    id: null,
  });
  const [warnNote, setWarnNote] = useState("");

  const ignore = (id: string) => {
    setItems((prev) => prev.filter((m) => m.id !== id));
    toast.info(`Signalement ${id} ignoré.`);
  };

  const confirmDelete = () => {
    if (!dialog.id) return;
    setItems((prev) => prev.filter((m) => m.id !== dialog.id));
    toast.success(`Message ${dialog.id} supprimé.`);
    setDialog({ mode: null, id: null });
  };

  const confirmWarn = () => {
    if (!dialog.id) return;
    toast.success(`Avertissement envoyé à l'auteur du message ${dialog.id}.`);
    setItems((prev) => prev.filter((m) => m.id !== dialog.id));
    setDialog({ mode: null, id: null });
    setWarnNote("");
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
        <CheckCircle2 className="mx-auto size-10 text-kaza-green" />
        <h3 className="mt-3 font-heading text-lg font-semibold">
          Aucun message à modérer
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Tous les signalements ont été traités. Beau travail !
        </p>
      </div>
    );
  }

  const currentItem = items.find((m) => m.id === dialog.id);

  return (
    <>
      <div className="space-y-3">
        {items.map((m) => {
          const [first, ...rest] = m.author.split(" ");
          return (
            <Card key={m.id} className="border-l-4 border-l-orange-400">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-kaza-navy text-xs text-white">
                        {getInitials(first ?? "", rest.join(" "))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{m.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.authorEmail}
                      </p>
                    </div>
                  </div>
                  <Badge className="gap-1 border-0 bg-orange-100 text-orange-800">
                    <AlertTriangle className="size-3" />
                    {m.flagReason}
                  </Badge>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 text-sm italic text-foreground">
                  <MessageSquare className="mr-1 inline size-3.5 text-muted-foreground" />
                  « {m.excerpt} »
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Signalé par <strong>{m.flaggedBy}</strong> ·{" "}
                    {new Date(m.flaggedAt).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    #{m.id}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDialog({ mode: "delete", id: m.id })}
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    Supprimer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialog({ mode: "warn", id: m.id })}
                  >
                    Avertir l&apos;auteur
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => ignore(m.id)}
                  >
                    Ignorer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={dialog.mode !== null}
        onOpenChange={(open) => !open && setDialog({ mode: null, id: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === "delete"
                ? "Supprimer ce message ?"
                : "Avertir l'auteur"}
            </DialogTitle>
            <DialogDescription>
              {dialog.mode === "delete"
                ? "Cette action est irréversible. Le message sera retiré et l'auteur sera notifié."
                : `Un email d'avertissement sera envoyé à ${currentItem?.author ?? ""}.`}
            </DialogDescription>
          </DialogHeader>
          {dialog.mode === "warn" ? (
            <Textarea
              placeholder="Note interne (optionnel)..."
              value={warnNote}
              onChange={(e) => setWarnNote(e.target.value)}
              rows={3}
            />
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog({ mode: null, id: null })}
            >
              Annuler
            </Button>
            <Button
              variant={dialog.mode === "delete" ? "destructive" : "default"}
              onClick={dialog.mode === "delete" ? confirmDelete : confirmWarn}
              className={
                dialog.mode === "warn" ? "bg-kaza-navy hover:bg-kaza-navy/90" : ""
              }
            >
              {dialog.mode === "delete" ? "Supprimer" : "Envoyer l'avertissement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
