"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, PencilLine } from "lucide-react";

import { upsertEmailTemplate } from "@/actions/email-templates";
import type { EmailTemplateEntry } from "@/lib/queries/email-templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";

interface TemplatesEditorProps {
  templates: EmailTemplateEntry[];
}

interface EditState {
  key: string;
  name: string;
  subject: string;
  bodyHtml: string;
}

export function TemplatesEditor({ templates }: TemplatesEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [edit, setEdit] = useState<EditState | null>(null);

  const openEdit = (tpl: EmailTemplateEntry) =>
    setEdit({
      key: tpl.key,
      name: tpl.name,
      subject: tpl.subject,
      bodyHtml: tpl.bodyHtml,
    });

  const previewDoc = useMemo(() => {
    if (!edit) return "";
    return `<html><head><style>body{font-family:Inter,Helvetica,Arial,sans-serif;padding:24px;background:#f5f7fa;margin:0;}</style></head><body>${edit.bodyHtml}</body></html>`;
  }, [edit]);

  const handleSave = () => {
    if (!edit) return;
    startTransition(async () => {
      const result = await upsertEmailTemplate({
        key: edit.key,
        name: edit.name,
        subject: edit.subject,
        body_html: edit.bodyHtml,
      });
      if (result.success) {
        toast.success(`Template "${edit.name}" enregistré.`);
        setEdit(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Enregistrement impossible.");
      }
    });
  };

  return (
    <>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Les modèles par défaut proviennent du code (
        <code className="font-mono text-xs">
          src/lib/notifications/templates.ts
        </code>
        ). Une fois édités ici, ils sont persistés dans{" "}
        <code className="font-mono text-xs">email_templates</code> et surchargent
        la version du code. Les variables entre{" "}
        <code className="font-mono text-xs">{`{{ }}`}</code> sont remplacées au
        moment de l&apos;envoi.
      </div>

      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Mail className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Aucun template disponible
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl.key} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue">
                    <Mail className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{tpl.name}</CardTitle>
                      {tpl.isFallback ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-700"
                        >
                          Code
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700"
                        >
                          Personnalisé
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1 text-xs">
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                        {tpl.key}
                      </code>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {tpl.subject}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit gap-2"
                  onClick={() => openEdit(tpl)}
                >
                  <PencilLine className="size-4" />
                  Éditer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={edit !== null}
        onOpenChange={(open) => !open && setEdit(null)}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Éditer : {edit?.name ?? "Template"}</DialogTitle>
            <DialogDescription>
              Modifiez le code à gauche, l&apos;aperçu à droite se met à jour en
              direct. Les variables entre{" "}
              <code className="font-mono">{`{{ }}`}</code> sont remplacées à
              l&apos;envoi.
            </DialogDescription>
          </DialogHeader>

          {edit && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tpl-subject">Sujet</Label>
                <Input
                  id="tpl-subject"
                  value={edit.subject}
                  onChange={(e) =>
                    setEdit({ ...edit, subject: e.target.value })
                  }
                  placeholder="Sujet de l'email"
                />
              </div>

              {/* Vue partagée : code + aperçu live côte à côte */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tpl-body">Corps HTML</Label>
                  <Textarea
                    id="tpl-body"
                    value={edit.bodyHtml}
                    onChange={(e) =>
                      setEdit({ ...edit, bodyHtml: e.target.value })
                    }
                    className="min-h-[420px] font-mono text-xs leading-relaxed"
                    spellCheck={false}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Aperçu en direct</Label>
                  <div className="min-h-[420px] flex-1 overflow-hidden rounded-lg border border-border bg-white">
                    <iframe
                      title="Aperçu email"
                      srcDoc={previewDoc}
                      className="h-full min-h-[420px] w-full border-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEdit(null)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
