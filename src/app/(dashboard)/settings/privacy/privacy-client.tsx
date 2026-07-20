"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Cookie,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";

import {
  requestAccountDeletion,
  updatePrivacyPrefs,
  type PrivacyPrefs,
} from "@/actions/settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast-helper";

const RELEVANT_LOCAL_KEYS = [
  "kaza-profile-data",
  "kaza-notif-prefs",
  "kaza-demo-visits",
  "kaza-cookie-consent",
  "kaza-ad-prefs",
  "kaza-favorites",
  "kaza-expenses",
  "kaza-wallet-transactions",
  "kaza-demo-session",
] as const;

type Visibility = "public" | "tenants" | "private";

const defaultPrefs: PrivacyPrefs = {
  profileVisibility: "public",
  personalizedAds: false,
  shareAnonymizedData: true,
  showActivity: true,
};

function mergePrefs(initial: Record<string, unknown>): PrivacyPrefs {
  const next: PrivacyPrefs = { ...defaultPrefs };
  if (
    initial.profileVisibility === "public" ||
    initial.profileVisibility === "tenants" ||
    initial.profileVisibility === "private"
  ) {
    next.profileVisibility = initial.profileVisibility;
  }
  if (typeof initial.personalizedAds === "boolean") {
    next.personalizedAds = initial.personalizedAds;
  }
  if (typeof initial.shareAnonymizedData === "boolean") {
    next.shareAnonymizedData = initial.shareAnonymizedData;
  }
  if (typeof initial.showActivity === "boolean") {
    next.showActivity = initial.showActivity;
  }
  return next;
}

export function PrivacyClient({
  initialPrefs = {},
  deletionRequested = false,
}: {
  initialPrefs?: Record<string, unknown>;
  deletionRequested?: boolean;
}) {
  const [prefs, setPrefs] = useState<PrivacyPrefs>(() =>
    mergePrefs(initialPrefs),
  );
  const [deleted, setDeleted] = useState(deletionRequested);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const persistPrefs = (next: PrivacyPrefs) => {
    const previous = prefs;
    setPrefs(next);
    startTransition(async () => {
      const result = await updatePrivacyPrefs(next);
      if (result.success) {
        toast.success("Préférences mises à jour.");
      } else {
        setPrefs(previous);
        toast.error(result.error ?? "Impossible d'enregistrer vos préférences.");
      }
    });
  };

  const handleDownload = () => {
    if (typeof window === "undefined") return;
    try {
      const payload: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        source: "kaza-web",
        version: "1.0",
        data: {},
      };

      const data: Record<string, unknown> = {};
      for (const key of RELEVANT_LOCAL_KEYS) {
        const raw = window.localStorage.getItem(key);
        if (raw === null) continue;
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      }
      payload.data = data;

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `kaza-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Export généré");
    } catch {
      toast.error("Impossible de générer l'export.");
    }
  };

  const resetDeleteDialog = () => {
    setDeleteStep(1);
    setAcknowledged(false);
    setConfirmText("");
  };

  const handleDeleteOpenChange = (next: boolean) => {
    setDeleteDialogOpen(next);
    if (!next) resetDeleteDialog();
  };

  const handleConfirmDelete = () => {
    startDeleting(async () => {
      const result = await requestAccountDeletion();
      if (result.success) {
        setDeleted(true);
        setDeleteDialogOpen(false);
        resetDeleteDialog();
        toast.success(
          "Demande enregistrée. Votre compte sera supprimé sous 30 jours.",
        );
      } else {
        toast.error(result.error ?? "Impossible d'enregistrer la demande.");
      }
    });
  };

  const handleResetCookies = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem("kaza-cookie-consent");
      window.alert(
        "Rafraîchissez la page pour revoir le bandeau cookies.",
      );
    } catch {
      toast.error("Impossible de réinitialiser les cookies.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 0. Visibilité du profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-kaza-navy">
            <Eye className="size-5 text-kaza-navy" />
            Visibilité du profil
          </CardTitle>
          <CardDescription>
            Contrôlez qui peut voir votre profil et votre activité sur Kaabo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <Label
                htmlFor="profile-visibility"
                className="text-sm font-medium text-foreground"
              >
                Qui peut voir mon profil ?
              </Label>
              <p className="text-xs text-muted-foreground">
                Détermine la visibilité de votre nom et photo de profil.
              </p>
            </div>
            <Select
              value={prefs.profileVisibility}
              disabled={isPending}
              onValueChange={(value) =>
                persistPrefs({
                  ...prefs,
                  profileVisibility: value as Visibility,
                })
              }
            >
              <SelectTrigger
                id="profile-visibility"
                className="w-full sm:w-[220px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Tout le monde</SelectItem>
                <SelectItem value="tenants">
                  Mes interlocuteurs uniquement
                </SelectItem>
                <SelectItem value="private">Personne (privé)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label
                htmlFor="show-activity"
                className="text-sm font-medium text-foreground"
              >
                Afficher mon activité
              </Label>
              <p className="text-xs text-muted-foreground">
                Laisse apparaître votre dernière connexion et votre statut.
              </p>
            </div>
            <Switch
              id="show-activity"
              checked={prefs.showActivity}
              disabled={isPending}
              onCheckedChange={(checked) =>
                persistPrefs({ ...prefs, showActivity: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 1. Vos données chez Kaabo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-kaza-navy">
            <ShieldCheck className="size-5 text-kaza-green" />
            Vos données chez Kaabo
          </CardTitle>
          <CardDescription>
            Nous collectons uniquement ce qui est nécessaire pour vous servir.
            Toutes vos données sont chiffrées et protégées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/legal/confidentialite">
              <FileText className="mr-1.5 size-4" />
              Lire la politique de confidentialité
              <ExternalLink className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* 2. Téléchargement RGPD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-kaza-navy">
            <Download className="size-5 text-kaza-blue" />
            Téléchargement de vos données
          </CardTitle>
          <CardDescription>
            Conformément au RGPD, vous pouvez télécharger une copie de vos
            données personnelles à tout moment au format JSON.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleDownload}
            className="bg-kaza-blue hover:bg-kaza-blue/90"
          >
            <Download className="mr-1.5 size-4" />
            Télécharger mes données
          </Button>
        </CardContent>
      </Card>

      {/* 3. Suppression de compte */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-kaza-navy">
            <Trash2 className="size-5 text-orange-600" />
            Suppression de compte
          </CardTitle>
          <CardDescription>
            Si vous souhaitez ne plus utiliser Kaabo, vous pouvez demander la
            suppression définitive de votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deleted ? (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertTitle>Demande de suppression enregistrée</AlertTitle>
              <AlertDescription>
                Votre demande a bien été reçue. Votre compte sera supprimé sous
                30 jours. Contactez le support pour l&apos;annuler.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert variant="warning">
                <AlertTriangle />
                <AlertTitle>Action définitive et irréversible</AlertTitle>
                <AlertDescription>
                  Toutes vos annonces, messages, paiements et historique seront
                  supprimés sans possibilité de récupération.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-1.5 size-4" />
                Demander l&apos;effacement
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* 4. Préférences publicitaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-kaza-navy">
            <Megaphone className="size-5 text-kaza-blue" />
            Préférences publicitaires
          </CardTitle>
          <CardDescription>
            Choisissez comment vos données peuvent être utilisées pour la
            publicité et l&apos;amélioration du produit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label
                htmlFor="personalized-ads"
                className="text-sm font-medium text-foreground"
              >
                Activer la publicité personnalisée
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des annonces adaptées à vos centres d&apos;intérêt.
              </p>
            </div>
            <Switch
              id="personalized-ads"
              checked={prefs.personalizedAds}
              disabled={isPending}
              onCheckedChange={(checked) =>
                persistPrefs({ ...prefs, personalizedAds: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label
                htmlFor="anonymized-data"
                className="text-sm font-medium text-foreground"
              >
                Partager mes données anonymisées
              </Label>
              <p className="text-xs text-muted-foreground">
                Aidez-nous à améliorer Kaabo en partageant des données 100%
                anonymes sur votre usage.
              </p>
            </div>
            <Switch
              id="anonymized-data"
              checked={prefs.shareAnonymizedData}
              disabled={isPending}
              onCheckedChange={(checked) =>
                persistPrefs({ ...prefs, shareAnonymizedData: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Cookies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-kaza-navy">
            <Cookie className="size-5 text-amber-600" />
            Cookies
          </CardTitle>
          <CardDescription>
            Gérez les cookies utilisés sur Kaabo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleResetCookies}>
            <Cookie className="mr-1.5 size-4" />
            Modifier mes préférences cookies
          </Button>
        </CardContent>
      </Card>

      {/* 6. Sessions & appareils */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-kaza-navy">
            <Smartphone className="size-5 text-kaza-navy" />
            Sessions & appareils
          </CardTitle>
          <CardDescription>
            Consultez les appareils connectés à votre compte et déconnectez les
            sessions suspectes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/settings/security">
              <ShieldCheck className="mr-1.5 size-4" />
              Gérer mes sessions
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Dialog suppression compte 2 étapes */}
      <Dialog open={deleteDialogOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-kaza-navy">
              <ShieldAlert className="size-5 text-orange-600" />
              {deleteStep === 1
                ? "Avant de continuer"
                : "Confirmation finale"}
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 1
                ? "Veuillez prendre connaissance des conséquences de cette action."
                : "Tapez le mot demandé ci-dessous pour confirmer la suppression."}
            </DialogDescription>
          </DialogHeader>

          {deleteStep === 1 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                <p className="font-semibold">
                  En supprimant votre compte, vous perdrez :
                </p>
                <ul className="mt-2 ml-5 list-disc space-y-1">
                  <li>Toutes vos annonces publiées</li>
                  <li>L&apos;historique de vos paiements et reçus</li>
                  <li>Vos conversations et messages</li>
                  <li>Vos favoris et préférences</li>
                  <li>L&apos;accès à vos contrats signés</li>
                </ul>
              </div>
              <label className="flex items-start gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 size-4 cursor-pointer rounded border-input accent-kaza-blue"
                />
                <span>
                  Je comprends que cette action est définitive et irréversible.
                </span>
              </label>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDeleteOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={!acknowledged}
                  onClick={() => setDeleteStep(2)}
                >
                  Continuer
                </Button>
              </DialogFooter>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="delete-confirm" className="text-sm">
                  Tapez{" "}
                  <span className="font-mono font-bold text-orange-700">
                    SUPPRIMER
                  </span>{" "}
                  pour confirmer
                </Label>
                <Input
                  id="delete-confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  autoComplete="off"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteStep(1)}
                >
                  Retour
                </Button>
                <Button
                  type="button"
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={confirmText !== "SUPPRIMER" || isDeleting}
                  onClick={handleConfirmDelete}
                >
                  <Trash2 className="mr-1.5 size-4" />
                  {isDeleting ? "Envoi…" : "Supprimer mon compte"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
