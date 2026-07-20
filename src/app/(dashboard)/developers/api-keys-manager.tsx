"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";

import {
  generateApiKey,
  revokeApiKey,
  type ApiKeyDTO,
} from "@/actions/api-keys";
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

interface ApiKeysManagerProps {
  keys: ApiKeyDTO[];
  canCreate: boolean;
}

export function ApiKeysManager({ keys, canCreate }: ApiKeysManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = () => {
    startTransition(async () => {
      const res = await generateApiKey(name || "Clé API");
      if (!res.success || !res.apiKey) {
        toast.error(res.error ?? "Création impossible.");
        return;
      }
      setRevealed(res.apiKey);
      setName("");
      router.refresh();
    });
  };

  const revoke = (id: string) => {
    startTransition(async () => {
      const res = await revokeApiKey(id);
      if (!res.success) {
        toast.error(res.error ?? "Révocation impossible.");
        return;
      }
      toast.success("Clé révoquée.");
      router.refresh();
    });
  };

  const copy = async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Création */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Nom de la clé
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Intégration CRM, site web…"
              disabled={!canCreate || pending}
            />
          </div>
          <Button onClick={create} disabled={!canCreate || pending}>
            {pending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Plus className="mr-1.5 size-4" />
            )}
            Générer une clé
          </Button>
        </CardContent>
      </Card>

      {!canCreate && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Pour générer des clés API, connectez-vous avec un compte{" "}
          <strong>développeur</strong> ou <strong>agence</strong>.
        </p>
      )}

      {/* Liste des clés */}
      {keys.length === 0 ? (
        <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Aucune clé API pour le moment.
        </p>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <Card key={k.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-4 text-kaza-blue" />
                    <span className="font-medium">{k.name}</span>
                    <Badge variant={k.isActive ? "secondary" : "outline"}>
                      {k.isActive ? "Active" : "Révoquée"}
                    </Badge>
                    <Badge variant="outline">
                      {k.tier === "AGENCY" ? "Agence (gratuit)" : "Développeur"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {k.keyPrefix}••••••••••••••••
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {k.callCount} appels
                    {k.lastUsedAt
                      ? ` · dernier le ${new Date(k.lastUsedAt).toLocaleDateString("fr-FR")}`
                      : " · jamais utilisée"}
                  </p>
                </div>
                {k.isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => revoke(k.id)}
                    disabled={pending}
                  >
                    <Trash2 className="mr-1 size-4" />
                    Révoquer
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Révélation unique de la clé */}
      <Dialog open={revealed !== null} onOpenChange={(o) => !o && setRevealed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Votre nouvelle clé API</DialogTitle>
            <DialogDescription>
              Copiez-la maintenant : pour des raisons de sécurité, elle ne sera{" "}
              <strong>plus jamais affichée</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
            <code className="flex-1 break-all font-mono text-xs">
              {revealed}
            </code>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setRevealed(null)}>J&apos;ai copié ma clé</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
