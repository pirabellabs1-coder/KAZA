"use client";

import { useState } from "react";
import { Lock, Bell, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-kaza-navy" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export function SettingsForm() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [visitNotifications, setVisitNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  return (
    <div className="space-y-6">
      {/* Password section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5 text-kaza-navy" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>
            Assurez-vous d&apos;utiliser un mot de passe fort et unique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Entrez votre mot de passe actuel"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Entrez un nouveau mot de passe"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum 8 caractères avec au moins une majuscule, un chiffre et
                un caractère spécial.
              </p>
            </div>
            <div>
              <Label htmlFor="confirmPassword">
                Confirmer le nouveau mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirmez le nouveau mot de passe"
                className="mt-1.5"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button>Mettre à jour le mot de passe</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-kaza-navy" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choisissez comment et quand vous souhaitez être notifié.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <Toggle
              checked={emailNotifications}
              onChange={setEmailNotifications}
              label="Notifications par email"
              description="Recevez les notifications importantes par email"
            />
            <Separator />
            <Toggle
              checked={smsNotifications}
              onChange={setSmsNotifications}
              label="Notifications par SMS"
              description="Recevez les alertes urgentes par SMS"
            />
            <Separator />
            <Toggle
              checked={visitNotifications}
              onChange={setVisitNotifications}
              label="Demandes de visite"
              description="Soyez notifié lorsqu'un locataire demande une visite"
            />
            <Separator />
            <Toggle
              checked={paymentNotifications}
              onChange={setPaymentNotifications}
              label="Paiements"
              description="Recevez un rappel pour les paiements à venir et les confirmations"
            />
            <Separator />
            <Toggle
              checked={marketingEmails}
              onChange={setMarketingEmails}
              label="Emails promotionnels"
              description="Recevez des conseils, actualités et offres de KAZA"
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Zone de danger
          </CardTitle>
          <CardDescription>
            Ces actions sont irréversibles. Procédez avec prudence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">
                  Supprimer le compte
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Toutes vos données seront définitivement supprimées. Cette
                  action ne peut pas être annulée.
                </p>
              </div>
              <Button
                variant="destructive"
                className="shrink-0"
              >
                <Trash2 className="mr-2 size-4" />
                Supprimer le compte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
