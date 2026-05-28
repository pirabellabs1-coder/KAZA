import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Globe,
  Bell,
  Shield,
  Users,
  Image as ImageIcon,
  Save,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Check,
  Smartphone,
  Mail,
  MessageSquare,
  Key,
  Webhook,
  Download,
  LogOut,
  Trash2,
  PauseCircle,
  Monitor,
  MapPin,
  Pencil,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { SettingsProfileForm } from "./settings-profile-form";

// ---------------------------------------------------------------------------
// Types & fallbacks locaux — à brancher quand la table agency_profiles /
// team_members sera en place.
// ---------------------------------------------------------------------------

type AgentRole =
  | "Directrice"
  | "Manager"
  | "Agent senior"
  | "Agent"
  | "Stagiaire"
  | "Comptable"
  | "Gestionnaire";

interface AgentMember {
  id: string;
  name: string;
  role: AgentRole;
  email: string;
  initials: string;
  color: string;
  permissions: string[];
}

// Fallback vide — à brancher quand la table agency_profiles sera en place.
const AGENCY_PROFILE = {
  name: "",
  legalName: "",
  oapi: "",
  city: "",
  address: "",
  email: "",
  phone: "",
  website: "",
  description: "",
  rccm: "",
  ifu: "",
};

// Fallback vide — à brancher quand la table team_members sera en place.
const AGENCY_TEAM: AgentMember[] = [];

export const metadata: Metadata = {
  title: "Paramètres agence — KAZA Pro",
  description:
    "Configurez votre profil agence, votre page publique, vos notifications et vos paramètres de sécurité.",
};

// ---------------------------------------------------------------------------
// Helpers / constantes
// ---------------------------------------------------------------------------

const ACCENT_COLORS = [
  { key: "navy", label: "Navy", className: "bg-kaza-navy" },
  { key: "blue", label: "Blue", className: "bg-kaza-blue" },
  { key: "green", label: "Green", className: "bg-kaza-green" },
  { key: "amber", label: "Amber", className: "bg-amber-500" },
  { key: "rose", label: "Rose", className: "bg-rose-500" },
  { key: "purple", label: "Purple", className: "bg-purple-500" },
];

const NOTIFICATION_EVENTS = [
  { key: "new_lead", label: "Nouveau lead", email: true, sms: true, push: true },
  { key: "visit_confirmed", label: "Visite confirmée", email: true, sms: true, push: true },
  { key: "signature", label: "Signature de contrat", email: true, sms: false, push: true },
  { key: "payment_received", label: "Paiement reçu", email: true, sms: false, push: true },
  { key: "client_review", label: "Avis client", email: true, sms: false, push: false },
  { key: "weekly_report", label: "Rapport hebdomadaire", email: true, sms: false, push: false },
  { key: "invoice_issued", label: "Facture émise", email: true, sms: false, push: false },
];

const ROLE_LABEL: Record<AgentRole, string> = {
  Directrice: "Directrice",
  Manager: "Manager",
  "Agent senior": "Agent senior",
  Agent: "Agent",
  Stagiaire: "Stagiaire",
  Comptable: "Comptable",
  Gestionnaire: "Gestionnaire",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgencySettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
          Paramètres agence
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez l&apos;identité, la page publique, les notifications et la sécurité de
          votre agence.
        </p>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="profil" className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap justify-start bg-muted/60 p-1">
          <TabsTrigger value="profil" className="gap-2">
            <Building2 className="size-4" />
            Profil agence
          </TabsTrigger>
          <TabsTrigger value="public" className="gap-2">
            <Globe className="size-4" />
            Page publique
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="size-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="size-4" />
            Sécurité &amp; API
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="size-4" />
            Membres &amp; permissions
          </TabsTrigger>
        </TabsList>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* TAB 1 — Profil agence (client component avec auto-save)            */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="profil" className="space-y-6">
          <SettingsProfileForm
            rccm={AGENCY_PROFILE.rccm}
            ifu={AGENCY_PROFILE.ifu}
            initialValues={{
              commercialName: AGENCY_PROFILE.name,
              legalName: AGENCY_PROFILE.legalName,
              oapi: AGENCY_PROFILE.oapi,
              city: AGENCY_PROFILE.city,
              address: AGENCY_PROFILE.address,
              email: AGENCY_PROFILE.email,
              phone: AGENCY_PROFILE.phone,
              website: AGENCY_PROFILE.website,
              description: AGENCY_PROFILE.description,
            }}
          />
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* TAB 2 — Page publique                                              */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="public" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5 text-kaza-blue" />
                URL personnalisée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="custom-url">URL de votre page agence</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-1 items-center rounded-lg border border-input">
                  <span className="border-r border-input bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                    kaza.africa/agences/
                  </span>
                  <Input
                    id="custom-url"
                    defaultValue="premier-immobilier"
                    className="border-0 focus-visible:ring-0"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="size-4" />
                  Visiter ma page
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Couleur d&apos;accent</Label>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((color, idx) => (
                    <button
                      key={color.key}
                      type="button"
                      className={`relative flex size-12 items-center justify-center rounded-xl ring-offset-2 transition ${
                        color.className
                      } ${idx === 0 ? "ring-2 ring-kaza-navy" : "hover:ring-2 hover:ring-border"}`}
                      title={color.label}
                    >
                      {idx === 0 && <Check className="size-5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Bannière de couverture</Label>
                <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                  <div className="text-center">
                    <ImageIcon className="mx-auto mb-2 size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Déposez votre bannière (1920 × 480 px)
                    </p>
                    <p className="text-xs text-muted-foreground">JPG ou PNG, 5 MB max</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Présentation publique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="public-about">À propos</Label>
                <Textarea
                  id="public-about"
                  rows={5}
                  placeholder="Présentez votre agence aux visiteurs..."
                  defaultValue={AGENCY_PROFILE.description}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">Vidéo de présentation YouTube</Label>
                <Input
                  id="youtube"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réseaux sociaux</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="size-4 text-blue-600" />
                  Facebook
                </Label>
                <Input id="facebook" placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="size-4 text-rose-500" />
                  Instagram
                </Label>
                <Input id="instagram" placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="size-4 text-blue-700" />
                  LinkedIn
                </Label>
                <Input id="linkedin" placeholder="https://linkedin.com/company/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="size-4 text-foreground" />X (Twitter)
                </Label>
                <Input id="twitter" placeholder="https://x.com/..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Options d&apos;affichage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/70 p-4">
                <div>
                  <p className="font-medium text-foreground">
                    Afficher l&apos;équipe sur la page publique
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vos agents apparaîtront avec photo, rôle et coordonnées.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 p-4">
                <div>
                  <p className="font-medium text-foreground">Activer les avis clients</p>
                  <p className="text-xs text-muted-foreground">
                    Les locataires pourront laisser une évaluation publique.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-4 z-10 flex justify-end gap-2 rounded-2xl border border-border bg-white/90 p-3 shadow-md backdrop-blur">
            <Button variant="ghost">Annuler</Button>
            <Button className="gap-2">
              <Save className="size-4" />
              Enregistrer
            </Button>
          </div>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* TAB 3 — Notifications                                              */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5 text-kaza-blue" />
                Canaux par évènement
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type d&apos;évènement</TableHead>
                      <TableHead className="text-center">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3.5" />
                          Email
                        </span>
                      </TableHead>
                      <TableHead className="text-center">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="size-3.5" />
                          SMS
                        </span>
                      </TableHead>
                      <TableHead className="text-center">
                        <span className="inline-flex items-center gap-1">
                          <Smartphone className="size-3.5" />
                          Push
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {NOTIFICATION_EVENTS.map((evt) => (
                      <TableRow key={evt.key}>
                        <TableCell className="font-medium text-foreground">
                          {evt.label}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch defaultChecked={evt.email} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch defaultChecked={evt.sms} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch defaultChecked={evt.push} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Horaires de notification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Heure de début</Label>
                    <Input type="time" defaultValue="08:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure de fin</Label>
                    <Input type="time" defaultValue="20:00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Jours actifs</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, idx) => (
                      <Badge
                        key={day}
                        variant={idx < 6 ? "default" : "outline"}
                        className={
                          idx < 6
                            ? "cursor-pointer bg-kaza-navy text-white hover:bg-kaza-navy/90"
                            : "cursor-pointer"
                        }
                      >
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Aucune notification ne sera envoyée en dehors de cette plage.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { id: "freq-daily", label: "Quotidien", desc: "Tous les matins à 7h00" },
                  { id: "freq-weekly", label: "Hebdomadaire", desc: "Tous les lundis à 8h00", default: true },
                  { id: "freq-disabled", label: "Désactivé", desc: "Aucun récapitulatif" },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    htmlFor={opt.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 p-4 hover:bg-muted/30"
                  >
                    <input
                      type="radio"
                      name="email-freq"
                      id={opt.id}
                      defaultChecked={opt.default}
                      className="mt-1 size-4 accent-kaza-blue"
                    />
                    <div>
                      <p className="font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="sticky bottom-4 z-10 flex justify-end gap-2 rounded-2xl border border-border bg-white/90 p-3 shadow-md backdrop-blur">
            <Button variant="ghost">Annuler</Button>
            <Button className="gap-2">
              <Save className="size-4" />
              Enregistrer
            </Button>
          </div>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* TAB 4 — Sécurité & API                                             */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-6">
          {/* 2FA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5 text-kaza-green" />
                Double authentification (2FA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    Activée
                  </Badge>
                  <p className="text-sm text-foreground">
                    Méthode : SMS sur +229 97 11 22 33
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Désactiver
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sessions actives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="size-5 text-kaza-blue" />
                Sessions actives (3)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Appareil</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Dernière activité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Chrome sur Windows</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3" />
                        Cotonou, BJ
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Maintenant
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      Session actuelle
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Safari sur iPhone</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3" />
                        Cotonou, BJ
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">Il y a 2h</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700">
                        <LogOut className="mr-1 size-3.5" />
                        Déconnecter
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Firefox sur Ubuntu</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3" />
                        Calavi, BJ
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">Hier, 18h32</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700">
                        <LogOut className="mr-1 size-3.5" />
                        Déconnecter
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="size-5 text-kaza-blue" />
                Clés API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                <Key className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Aucune clé API créée
                </p>
                <p className="text-xs text-muted-foreground">
                  Créez une clé pour intégrer KAZA à vos outils internes.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input placeholder="Nom de la clé (ex: Intégration CRM)" className="flex-1" />
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue="read"
                >
                  <option value="read">Lecture seule</option>
                  <option value="write">Lecture + écriture</option>
                </select>
                <Button className="gap-2">
                  <Key className="size-4" />
                  Créer une clé API
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="size-5 text-kaza-blue" />
                Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                <Webhook className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  0 webhook configuré
                </p>
                <p className="text-xs text-muted-foreground">
                  Recevez en temps réel les évènements (leads, signatures, paiements).
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input placeholder="URL de votre endpoint" className="flex-1" />
                <Input placeholder="Évènements (signature,lead,...)" className="sm:w-64" />
                <Button variant="outline" className="gap-2">
                  <Webhook className="size-4" />+ Ajouter un webhook
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* RGPD */}
          <Card>
            <CardHeader>
              <CardTitle>Export RGPD</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                Téléchargez toutes les données associées à votre agence au format JSON.
              </p>
              <Button variant="outline" className="gap-2">
                <Download className="size-4" />
                Télécharger toutes vos données
              </Button>
            </CardContent>
          </Card>

          {/* Zone dangereuse */}
          <Card className="border-2 border-rose-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700">
                <Trash2 className="size-5" />
                Zone dangereuse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50/50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-rose-900">
                    Suspendre temporairement l&apos;agence
                  </p>
                  <p className="text-sm text-rose-700">
                    Vos annonces seront cachées du public mais conservées.
                  </p>
                </div>
                <Button variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-100 hover:text-rose-800">
                  <PauseCircle className="mr-2 size-4" />
                  Suspendre
                </Button>
              </div>
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-rose-900">
                    Supprimer définitivement le compte agence
                  </p>
                  <p className="text-sm text-rose-700">
                    Toutes les données seront effacées. Cette action est irréversible.
                  </p>
                </div>
                <Button className="bg-rose-600 text-white hover:bg-rose-700">
                  <Trash2 className="mr-2 size-4" />
                  Supprimer le compte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* TAB 5 — Membres & permissions                                      */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-kaza-blue" />
                Vue d&apos;ensemble équipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-heading text-2xl font-bold text-kaza-navy">
                    {AGENCY_TEAM.length} membres actifs
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sur 15 places disponibles dans votre plan Premium.
                  </p>
                </div>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/agency/team">
                    Gérer l&apos;équipe
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rôles &amp; permissions</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Permissions actives</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {AGENCY_TEAM.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white ${member.color}`}
                            >
                              {member.initials}
                            </div>
                            <span className="font-medium text-foreground">
                              {member.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.email}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-kaza-blue/10 text-kaza-blue hover:bg-kaza-blue/10">
                            {ROLE_LABEL[member.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {member.permissions.slice(0, 3).map((perm) => (
                              <Badge
                                key={perm}
                                variant="outline"
                                className="text-[10px] uppercase"
                              >
                                {perm}
                              </Badge>
                            ))}
                            {member.permissions.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{member.permissions.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Pencil className="size-3.5" />
                            Modifier
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
