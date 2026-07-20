"use client";

// =============================================================================
// Kaabo - ReferralCodeCard
//
// Petit composant client : affiche le code de parrainage, gere copy +
// share natif (Web Share API quand dispo), et propose un bouton
// "Generer mon code" si le user n'en a pas encore (ex : code expire ou
// trigger non execute). L'appel `getOrCreateReferralCode()` est une
// server action ; on rafraichit la page apres reussite.
// =============================================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Mail, Send, Share2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast-helper";
import { getOrCreateReferralCode, inviteByEmail } from "@/actions/referrals";

interface ReferralCodeCardProps {
  initialCode: string | null;
  userFirstName: string;
}

export function ReferralCodeCard({
  initialCode,
  userFirstName,
}: ReferralCodeCardProps) {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(initialCode);
  const [isPending, startTransition] = useTransition();
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, startInviting] = useTransition();

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://kaza-jade.vercel.app"
  ).replace(/\/$/, "");
  const referralLink = code ? `${appUrl}/signup?ref=${code}` : null;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) {
      toast.error("Saisissez une adresse email.");
      return;
    }
    startInviting(async () => {
      const result = await inviteByEmail(email);
      if (result.success) {
        toast.success(`Invitation envoyee a ${email}`);
        setInviteEmail("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Impossible d'envoyer l'invitation.");
      }
    });
  };

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await getOrCreateReferralCode();
      if (!result.code) {
        toast.error(result.error ?? "Impossible de generer un code.");
        return;
      }
      setCode(result.code);
      toast.success("Code de parrainage cree !");
      router.refresh();
    });
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copie dans le presse-papiers !");
    } catch {
      toast.error("Impossible de copier le code. Reessayez.");
    }
  };

  const handleShare = async () => {
    if (!code || !referralLink) return;
    const shareData = {
      title: "Rejoignez Kaabo avec mon code",
      text: `Salut, j'utilise Kaabo pour la location au Benin. Inscris-toi avec mon code ${code} et profite d'avantages exclusifs.`,
      url: referralLink,
    };
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(
        `${shareData.text} ${shareData.url}`,
      );
      toast.info("Lien d'invitation copie dans le presse-papiers !");
    } catch {
      toast.error("Le partage n'est pas disponible.");
    }
  };

  return (
    <Card className="border-2 border-kaza-blue/20 bg-gradient-to-br from-white to-kaza-blue/5">
      <CardContent className="flex flex-col items-center gap-6 p-8 sm:p-10">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Votre code personnel
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bonjour {userFirstName}, partagez ce code avec vos proches
          </p>
        </div>

        {code ? (
          <>
            <div className="rounded-xl border-2 border-dashed border-kaza-blue/40 bg-white px-8 py-4 sm:px-12">
              <p className="font-heading text-2xl font-bold tracking-widest text-kaza-navy sm:text-3xl">
                {code}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                size="lg"
                onClick={handleCopy}
                className="gap-2"
              >
                <Copy className="size-4" />
                Copier le code
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="size-4" />
                Partager
              </Button>
            </div>
            {referralLink && (
              <p className="break-all text-center text-xs text-muted-foreground">
                Lien direct :{" "}
                <span className="font-mono">{referralLink}</span>
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              Vous n&apos;avez pas encore de code de parrainage. Generez-le en un
              clic pour commencer a inviter vos proches.
            </p>
            <Button
              type="button"
              size="lg"
              onClick={handleGenerate}
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {isPending ? "Generation…" : "Generer mon code"}
            </Button>
          </div>
        )}

        <Separator className="w-full" />

        {/* Invitation par email — envoie un vrai email avec le lien d'inscription */}
        <form
          onSubmit={handleInvite}
          className="flex w-full max-w-md flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-kaza-navy">
            <Mail className="size-4" />
            Inviter un proche par email
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Nous lui enverrons un email avec votre lien d&apos;inscription. Vous
            gagnez 1 000 points des sa premiere location signee.
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@exemple.com"
              autoComplete="email"
              disabled={isInviting}
              className="bg-white"
              aria-label="Email du proche a inviter"
              required
            />
            <Button
              type="submit"
              disabled={isInviting}
              className="gap-2 sm:shrink-0"
            >
              {isInviting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {isInviting ? "Envoi…" : "Inviter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
