"use client";

import { useState } from "react";
import {
  Lock,
  ShieldCheck,
  Smartphone,
  Monitor,
  Globe,
  LogOut,
  History,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast-helper";

const passwordSchema = z
  .object({
    current: z.string().min(1, "Mot de passe actuel requis"),
    next: z
      .string()
      .min(8, "Minimum 8 caractères")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre"),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, {
    message: "La confirmation ne correspond pas",
    path: ["confirm"],
  });

interface SessionItem {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current?: boolean;
  icon: typeof Monitor;
}

const SESSIONS: SessionItem[] = [
  {
    id: "s1",
    device: "Windows 11",
    browser: "Chrome 138",
    location: "Cotonou, Bénin",
    lastActive: "Actif maintenant",
    current: true,
    icon: Monitor,
  },
  {
    id: "s2",
    device: "iPhone 15",
    browser: "Safari Mobile",
    location: "Porto-Novo, Bénin",
    lastActive: "il y a 2 heures",
    icon: Smartphone,
  },
  {
    id: "s3",
    device: "macOS Sonoma",
    browser: "Firefox 129",
    location: "Abidjan, Côte d'Ivoire",
    lastActive: "il y a 3 jours",
    icon: Monitor,
  },
];

const LOGIN_HISTORY = [
  { date: "26/05/2026 09:42", ip: "102.16.45.12", browser: "Chrome / Windows" },
  { date: "25/05/2026 18:11", ip: "102.16.45.12", browser: "Chrome / Windows" },
  { date: "24/05/2026 14:30", ip: "41.203.78.221", browser: "Safari / iOS" },
  { date: "23/05/2026 21:05", ip: "102.16.45.12", browser: "Firefox / macOS" },
  { date: "22/05/2026 08:50", ip: "102.16.45.12", browser: "Chrome / Windows" },
];

export function SecurityClient() {
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdErrors, setPwdErrors] = useState<
    Partial<Record<keyof typeof pwd, string>>
  >({});
  const [twoFa, setTwoFa] = useState(false);
  const [sessions, setSessions] = useState(SESSIONS);

  const handlePasswordSubmit = () => {
    const result = passwordSchema.safeParse(pwd);
    if (!result.success) {
      const next: typeof pwdErrors = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof typeof pwd;
        if (!next[k]) next[k] = issue.message;
      }
      setPwdErrors(next);
      return;
    }
    setPwdErrors({});
    setPwd({ current: "", next: "", confirm: "" });
    toast.success("Mot de passe mis à jour");
  };

  const handleRevoke = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session déconnectée");
  };

  const handleToggle2Fa = (value: boolean) => {
    if (value) {
      toast.info("Bientôt disponible — l'activation 2FA arrive prochainement");
      return;
    }
    setTwoFa(false);
  };

  return (
    <div className="space-y-6">
      {/* Mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5 text-kaza-navy" />
            Mot de passe
          </CardTitle>
          <CardDescription>
            Utilisez au moins 8 caractères avec une majuscule et un chiffre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PasswordField
            id="current"
            label="Mot de passe actuel"
            value={pwd.current}
            error={pwdErrors.current}
            onChange={(v) => setPwd({ ...pwd, current: v })}
          />
          <PasswordField
            id="next"
            label="Nouveau mot de passe"
            value={pwd.next}
            error={pwdErrors.next}
            onChange={(v) => setPwd({ ...pwd, next: v })}
          />
          <PasswordField
            id="confirm"
            label="Confirmer le nouveau mot de passe"
            value={pwd.confirm}
            error={pwdErrors.confirm}
            onChange={(v) => setPwd({ ...pwd, confirm: v })}
          />
          <div className="flex justify-end pt-2">
            <Button onClick={handlePasswordSubmit}>Mettre à jour</Button>
          </div>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-kaza-navy" />
            Authentification à 2 facteurs (2FA)
          </CardTitle>
          <CardDescription>
            Ajoutez une seconde couche de sécurité en recevant un code par SMS lors
            de la connexion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">2FA par SMS</p>
              <p className="text-xs text-muted-foreground">
                Recevez un code à 6 chiffres sur votre téléphone à chaque connexion.
              </p>
            </div>
            <Switch checked={twoFa} onCheckedChange={handleToggle2Fa} />
          </div>
          <Alert variant="info">
            <Smartphone />
            <AlertTitle>Bientôt disponible</AlertTitle>
            <AlertDescription>
              L&apos;activation 2FA sera disponible dans la prochaine mise à jour.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Sessions actives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5 text-kaza-navy" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Appareils et navigateurs actuellement connectés à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune session active hormis celle-ci.
            </p>
          )}
          {sessions.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-kaza-navy/10 text-kaza-navy">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {s.device} · {s.browser}
                      </p>
                      {s.current && (
                        <Badge className="bg-kaza-green text-white hover:bg-kaza-green/90">
                          Cette session
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.location} — {s.lastActive}
                    </p>
                  </div>
                </div>
                {!s.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(s.id)}
                  >
                    <LogOut className="mr-2 size-4" />
                    Déconnecter
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Journal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5 text-kaza-navy" />
            Journal de connexion
          </CardTitle>
          <CardDescription>5 dernières connexions à votre compte.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Adresse IP</TableHead>
                <TableHead>Navigateur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LOGIN_HISTORY.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="text-sm">{row.date}</TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">
                    {row.ip}
                  </TableCell>
                  <TableCell className="text-sm">{row.browser}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            Si vous ne reconnaissez pas une connexion, changez immédiatement votre
            mot de passe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        className="mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
