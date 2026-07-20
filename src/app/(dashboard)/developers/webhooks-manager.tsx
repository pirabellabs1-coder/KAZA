"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Plus, Trash2, Webhook } from "lucide-react";

import {
  createWebhookEndpoint,
  revokeWebhookEndpoint,
  type WebhookDTO,
} from "@/actions/webhooks";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

interface WebhooksManagerProps {
  webhooks: WebhookDTO[];
  canCreate: boolean;
}

export function WebhooksManager({ webhooks, canCreate }: WebhooksManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["property.created"]);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleEvent = (e: string) =>
    setEvents((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );

  const create = () => {
    startTransition(async () => {
      const res = await createWebhookEndpoint(url, events);
      if (!res.success || !res.secret) {
        toast.error(res.error ?? "Création impossible.");
        return;
      }
      setSecret(res.secret);
      setUrl("");
      router.refresh();
    });
  };

  const revoke = (id: string) => {
    startTransition(async () => {
      const res = await revokeWebhookEndpoint(id);
      if (!res.success) {
        toast.error(res.error ?? "Suppression impossible.");
        return;
      }
      toast.success("Webhook supprimé.");
      router.refresh();
    });
  };

  const copySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-5">
      {/* Création */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              URL de réception (HTTPS)
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://votre-serveur.com/webhooks/kaabo"
              disabled={!canCreate || pending}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Événements
            </p>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map((e) => {
                const active = events.includes(e);
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => toggleEvent(e)}
                    disabled={!canCreate || pending}
                    className={cn(
                      "rounded-full border px-3 py-1 font-mono text-xs transition",
                      active
                        ? "border-kaza-blue bg-kaza-blue/10 text-kaza-blue"
                        : "border-input text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          </div>
          <Button
            onClick={create}
            disabled={!canCreate || pending || !url}
            size="sm"
          >
            <Plus className="mr-1.5 size-4" />
            Ajouter un webhook
          </Button>
        </CardContent>
      </Card>

      {!canCreate && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Pour utiliser les webhooks, connectez-vous avec un compte{" "}
          <strong>développeur</strong> ou <strong>agence</strong>.
        </p>
      )}

      {/* Liste */}
      {webhooks.length > 0 && (
        <div className="space-y-2">
          {webhooks.map((w) => (
            <Card key={w.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Webhook className="size-4 text-kaza-blue" />
                    <span className="truncate font-mono text-xs">{w.url}</span>
                    <Badge variant={w.isActive ? "secondary" : "outline"}>
                      {w.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {w.events.join(", ")}
                    {w.lastStatus != null &&
                      ` · dernière réponse : ${w.lastStatus}`}
                    {w.failureCount > 0 && ` · ${w.failureCount} échec(s)`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => revoke(w.id)}
                  disabled={pending}
                >
                  <Trash2 className="mr-1 size-4" />
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Secret révélé une fois */}
      <Dialog open={secret !== null} onOpenChange={(o) => !o && setSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Secret de signature</DialogTitle>
            <DialogDescription>
              Utilisez ce secret pour vérifier la signature{" "}
              <code className="font-mono text-xs">X-Kaabo-Signature</code>{" "}
              (HMAC-SHA256). Il ne sera <strong>plus jamais affiché</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
            <code className="flex-1 break-all font-mono text-xs">{secret}</code>
            <Button size="sm" variant="outline" onClick={copySecret}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setSecret(null)}>J&apos;ai copié</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
