"use client";

import { useState, useTransition } from "react";
import { Lock, Monitor, Globe, LogOut, History } from "lucide-react";
import { z } from "zod";

import { changePassword } from "@/actions/settings";
import { TwoFactorCard } from "@/components/settings/two-factor-card";
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
import { Separator } from "@/components/ui/separator";
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

// Aucune session fictive : on n'affiche que la session courante (réelle), sans
// localisation/IP inventées. Le suivi multi-appareils détaillé sera branché
// quand l'infrastructure de sessions sera disponible.
const SESSIONS: SessionItem[] = [
  {
    id: "current",
    device: "Cet appareil",
    browser: "Navigateur courant",
    location: "Session active",
    lastActive: "Actif maintenant",
    current: true,
    icon: Monitor,
  },
];

// Pas d'historique de connexion fabriqué : vide tant que le suivi réel n'est
// pas branché (empty-state honnête affiché dans le rendu).
const LOGIN_HISTORY: Array<{ date: string; ip: string; browser: string }> = [];

export function SecurityClient() {
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdErrors, setPwdErrors] = useState<
    Partial<Record<keyof typeof pwd, string>>
  >({});
  const [sessions, setSessions] = useState(SESSIONS);
  const [isPending, startTransition] = useTransition();

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
    startTransition(async () => {
      const res = await changePassword(pwd.next);
      if (res.success) {
        setPwd({ current: "", next: "", confirm: "" });
        toast.success("Mot de passe mis à jour");
      } else {
        toast.error(res.error ?? "Impossible de changer le mot de passe");
      }
    });
  };

  const handleRevoke = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session déconnectée");
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
            <Button onClick={handlePasswordSubmit} disabled={isPending}>
              {isPending ? "Mise à jour…" : "Mettre à jour"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2FA — TOTP réel via Supabase MFA */}
      <TwoFactorCard />

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
              {LOGIN_HISTORY.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    L&apos;historique détaillé de vos connexions sera bientôt
                    disponible.
                  </TableCell>
                </TableRow>
              ) : (
                LOGIN_HISTORY.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="text-sm">{row.date}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {row.ip}
                    </TableCell>
                    <TableCell className="text-sm">{row.browser}</TableCell>
                  </TableRow>
                ))
              )}
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
