"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Cookie,
  Download,
  ExternalLink,
  FileText,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast-helper";

const AD_PREFS_KEY = "kaza-ad-prefs";
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

interface AdPrefs {
  personalizedAds: boolean;
  shareAnonymizedData: boolean;
}

const defaultAdPrefs: AdPrefs = {
  personalizedAds: false,
  shareAnonymizedData: true,
};

export function PrivacyClient() {
  const [adPrefs, setAdPrefs] = useState<AdPrefs>(defaultAdPrefs);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Charger les préférences publicitaires
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AD_PREFS_KEY);
      if (raw) {
        setAdPrefs({ ...defaultAdPrefs, ...JSON.parse(raw) });
      }
    } catch {
      // ignore
    }
  }, []);

  const updateAdPrefs = (next: AdPrefs) => {
    setAdPrefs(next);
    try {
      window.localStorage.setItem(AD_PREFS_KEY, JSON.stringify(next));
      toast.success("Préférences mises à jour.");
    } catch {
      toast.error("Impossible d'enregistrer vos préférences.");
    }
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
    setDeleteDialogOpen(false);
    resetDeleteDialog();
    // Mode démo : pas de mutation serveur
    window.setTimeout(() => {
      window.alert(
        "Demande enregistrée. Votre compte sera supprimé sous 30 jours.",
      );
    }, 100);
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
      {/* 1. Vos données chez KAZA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-kaza-navy">
            <ShieldCheck className="size-5 text-kaza-green" />
            Vos données chez KAZA
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
            Si vous souhaitez ne plus utiliser KAZA, vous pouvez demander la
            suppression définitive de votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              checked={adPrefs.personalizedAds}
              onCheckedChange={(checked) =>
                updateAdPrefs({ ...adPrefs, personalizedAds: checked })
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
                Aidez-nous à améliorer KAZA en partageant des données 100%
                anonymes sur votre usage.
              </p>
            </div>
            <Switch
              id="anonymized-data"
              checked={adPrefs.shareAnonymizedData}
              onCheckedChange={(checked) =>
                updateAdPrefs({ ...adPrefs, shareAnonymizedData: checked })
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
            Gérez les cookies utilisés sur KAZA.
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
                  disabled={confirmText !== "SUPPRIMER"}
                  onClick={handleConfirmDelete}
                >
                  <Trash2 className="mr-1.5 size-4" />
                  Supprimer mon compte
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
