"use client";

// =============================================================================
// KAZA — Réinitialisation du mot de passe
// L'utilisateur arrive ici via le lien de l'email (Supabase pose une session
// de récupération via le hash). On affiche un formulaire de nouveau mot de
// passe et on appelle supabase.auth.updateUser({ password }).
// =============================================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast-helper";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase détecte automatiquement le token de récupération dans l'URL.
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(true);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Impossible de mettre à jour le mot de passe.");
      return;
    }
    setDone(true);
    toast.success("Mot de passe mis à jour. Vous pouvez vous connecter.");
    setTimeout(() => router.push("/login"), 1500);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-12 text-kaza-green" />
        <h1 className="font-heading text-2xl font-bold text-kaza-navy">
          Mot de passe mis à jour
        </h1>
        <p className="text-sm text-muted-foreground">
          Redirection vers la connexion…
        </p>
        <Button asChild className="mt-2">
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  if (ready && !hasSession) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy">
          Lien invalide ou expiré
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ce lien de réinitialisation n&apos;est plus valide. Demandez un
          nouveau lien depuis la page « Mot de passe oublié ».
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/forgot-password">Renvoyer un lien</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-muted-foreground">
          Choisissez un nouveau mot de passe sécurisé pour votre compte.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Au moins 8 caractères"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label={show ? "Masquer" : "Afficher"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmer le mot de passe</Label>
        <Input
          id="confirm"
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Retapez le mot de passe"
          autoComplete="new-password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading || !ready}>
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" /> Mise à jour…
          </>
        ) : (
          "Mettre à jour le mot de passe"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-kaza-blue hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
