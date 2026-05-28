"use client";

import { useMemo, useState } from "react";
import { Mail, Pencil, Save, Send } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";

interface TemplateDefinition {
  key: string;
  name: string;
  description: string;
  defaultSubject: string;
  defaultBody: string;
}

const TEMPLATES: TemplateDefinition[] = [
  {
    key: "welcome",
    name: "Bienvenue",
    description: "Envoyé après création de compte (welcomeTemplate).",
    defaultSubject: "Bienvenue sur KAZA, {{firstName}} !",
    defaultBody: `<h2 style="color:#1A3A52;">Bienvenue sur KAZA, {{firstName}} !</h2>
<p>Nous sommes ravis de vous compter parmi nos utilisateurs.</p>
<p>KAZA simplifie la location immobilière au Bénin : milliers d'annonces vérifiées, contact direct avec les propriétaires, paiements 100% sécurisés.</p>
<a href="{{appUrl}}/dashboard" style="display:inline-block;background:#1976D2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Accéder à mon tableau de bord</a>`,
  },
  {
    key: "visit_request",
    name: "Demande de visite",
    description: "Envoyé au propriétaire lors d'une nouvelle demande.",
    defaultSubject: "Nouvelle demande de visite : {{propertyTitle}}",
    defaultBody: `<h2 style="color:#1A3A52;">Nouvelle demande de visite</h2>
<p><strong>{{requesterName}}</strong> souhaite visiter votre bien :</p>
<div style="background:#f9fafb;border-left:4px solid #1976D2;padding:16px;margin:16px 0;">
  <p style="font-size:16px;font-weight:600;color:#1A3A52;">{{propertyTitle}}</p>
  <p>Date proposée : <strong>{{date}}</strong></p>
</div>
<a href="{{appUrl}}/dashboard/visites" style="display:inline-block;background:#1976D2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Voir la demande</a>`,
  },
  {
    key: "payment_received",
    name: "Paiement reçu",
    description: "Confirmation de paiement reçu par le propriétaire.",
    defaultSubject: "Paiement reçu : {{amount}} FCFA",
    defaultBody: `<h2 style="color:#1A3A52;">Paiement reçu</h2>
<p>Vous venez de recevoir un paiement pour le bien <strong>{{propertyTitle}}</strong>.</p>
<div style="background:#ecfdf5;border-left:4px solid #10b981;padding:16px;margin:16px 0;">
  <p style="font-size:24px;font-weight:700;color:#065f46;">{{amount}} FCFA</p>
</div>
<p>Le montant est détenu en séquestre et sera libéré selon les conditions du contrat.</p>`,
  },
  {
    key: "contract_ready",
    name: "Contrat prêt",
    description: "Le contrat de location est disponible à la signature.",
    defaultSubject: "Votre contrat de location est prêt : {{propertyTitle}}",
    defaultBody: `<h2 style="color:#1A3A52;">Votre contrat est prêt</h2>
<p>Le contrat de location pour <strong>{{propertyTitle}}</strong> est désormais disponible.</p>
<p>Prenez le temps de le lire attentivement avant de le signer.</p>
<a href="{{contractUrl}}" style="display:inline-block;background:#1976D2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Consulter et signer</a>`,
  },
  {
    key: "identity_approved",
    name: "Identité approuvée",
    description: "Vérification d'identité validée par l'équipe modération.",
    defaultSubject: "Votre identité a été vérifiée",
    defaultBody: `<h2 style="color:#1A3A52;">Votre identité est vérifiée</h2>
<p>Bonjour {{firstName}},</p>
<p>Bonne nouvelle ! Votre pièce d'identité a été validée. Votre profil affiche désormais le badge <strong>Vérifié</strong>.</p>
<div style="background:#ecfdf5;border-left:4px solid #10b981;padding:16px;margin:16px 0;">
  <p>Vous pouvez maintenant publier des annonces, faire des demandes et finaliser des contrats.</p>
</div>`,
  },
  {
    key: "identity_rejected",
    name: "Identité rejetée",
    description: "Vérification d'identité refusée avec motif.",
    defaultSubject: "Votre vérification d'identité nécessite une action",
    defaultBody: `<h2 style="color:#1A3A52;">Vérification d'identité non aboutie</h2>
<p>Bonjour {{firstName}},</p>
<p>Nous n'avons pas pu valider votre pièce d'identité.</p>
<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:16px 0;">
  <p style="font-weight:600;color:#92400e;">Motif :</p>
  <p style="color:#78350f;">{{reason}}</p>
</div>
<a href="{{appUrl}}/dashboard/verification" style="display:inline-block;background:#1976D2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Recommencer</a>`,
  },
];

interface TemplatesEditorProps {
  adminEmail: string;
}

interface EditorState {
  subject: string;
  body: string;
}

export function TemplatesEditor({ adminEmail }: TemplatesEditorProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>(TEMPLATES[0].key);
  const [drafts, setDrafts] = useState<Record<string, EditorState>>(() =>
    Object.fromEntries(
      TEMPLATES.map((t) => [
        t.key,
        { subject: t.defaultSubject, body: t.defaultBody },
      ]),
    ),
  );

  const activeTemplate = useMemo(
    () => TEMPLATES.find((t) => t.key === selectedKey) ?? TEMPLATES[0],
    [selectedKey],
  );
  const draft = drafts[activeTemplate.key];

  const updateDraft = (patch: Partial<EditorState>) => {
    setDrafts((prev) => ({
      ...prev,
      [activeTemplate.key]: { ...prev[activeTemplate.key], ...patch },
    }));
  };

  const handleSave = () => {
    toast.success(`Template "${activeTemplate.name}" enregistré.`);
  };

  const handleTestSend = () => {
    toast.info(`Email test envoyé à ${adminEmail} (mock Resend).`);
  };

  const openEditor = (key: string) => {
    setSelectedKey(key);
    setOpenKey(key);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <Card
            key={tpl.key}
            className="transition-shadow hover:shadow-md"
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue">
                  <Mail className="size-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{tpl.name}</CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                      {tpl.key}
                    </code>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{tpl.description}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-fit gap-2"
                onClick={() => openEditor(tpl.key)}
              >
                <Pencil className="size-4" />
                Éditer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={openKey !== null}
        onOpenChange={(open) => !open && setOpenKey(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Éditer un template</DialogTitle>
            <DialogDescription>
              Modifications sauvegardées localement (démo). Variables :{" "}
              <code className="font-mono">{`{{firstName}}`}</code>,{" "}
              <code className="font-mono">{`{{propertyTitle}}`}</code>, etc.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="template-select">Template</Label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger id="template-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="subject" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="subject">Sujet</TabsTrigger>
                <TabsTrigger value="body">Corps HTML</TabsTrigger>
                <TabsTrigger value="preview">Aperçu</TabsTrigger>
              </TabsList>

              <TabsContent value="subject" className="pt-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="subject-input">Sujet de l&apos;email</Label>
                  <Input
                    id="subject-input"
                    value={draft.subject}
                    onChange={(e) => updateDraft({ subject: e.target.value })}
                    placeholder="Sujet..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Les variables entre <code>{`{{ }}`}</code> sont remplacées
                    par les valeurs dynamiques au moment de l&apos;envoi.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="body" className="pt-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="body-input">Corps HTML</Label>
                  <Textarea
                    id="body-input"
                    value={draft.body}
                    onChange={(e) => updateDraft({ body: e.target.value })}
                    rows={20}
                    className="font-mono text-xs leading-relaxed"
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="pt-4">
                <div className="flex flex-col gap-2">
                  <Label>Aperçu du rendu</Label>
                  <div className="rounded-lg border border-border bg-white p-2">
                    <p className="border-b border-border px-3 py-2 text-sm">
                      <span className="font-semibold text-muted-foreground">
                        Sujet :
                      </span>{" "}
                      {draft.subject}
                    </p>
                    <iframe
                      title="Aperçu email"
                      srcDoc={`<html><head><style>body{font-family:Inter,Helvetica,Arial,sans-serif;padding:24px;background:#f5f7fa;margin:0;}</style></head><body>${draft.body}</body></html>`}
                      className="h-[400px] w-full rounded border-0"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleTestSend}
            >
              <Send className="size-4" />
              Tester l&apos;envoi
            </Button>
            <Button className="gap-2" onClick={handleSave}>
              <Save className="size-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
