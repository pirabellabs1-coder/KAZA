"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";
import { subscribeNewsletter } from "@/actions/newsletter";

// =============================================================================
// KAZA - Newsletter form (réutilisable)
// Vague 10 (reprise) - Moussa Keïta
//
// Composant client de souscription newsletter, disponible en 2 variantes :
//   - "inline" : input + bouton côte à côte (footer, barres CTA compactes)
//   - "block"  : layout vertical avec consentement RGPD (landing, sidebar)
//
// Submission via la server action `subscribeNewsletter`. Validation Zod inline.
// Anti-doublon UI via localStorage `kaza-newsletter-{email}`.
// =============================================================================

type Variant = "inline" | "block";

interface NewsletterFormProps {
  variant?: Variant;
  source?: string;
  className?: string;
}

const InlineSchema = z.object({
  email: z.string().email("Adresse email invalide."),
});

const BlockSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  consent: z.literal(true, {
    message: "Le consentement RGPD est requis.",
  }),
});

function storageKey(email: string): string {
  return `kaza-newsletter-${email.trim().toLowerCase()}`;
}

function alreadySubscribed(email: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey(email)) !== null;
  } catch {
    return false;
  }
}

function markSubscribed(email: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey(email),
      new Date().toISOString(),
    );
  } catch {
    /* noop */
  }
}

export function NewsletterForm({
  variant = "inline",
  source = "unknown",
  className,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(variant === "inline");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validation côté client -------------------------------------------------
    const schema = variant === "inline" ? InlineSchema : BlockSchema;
    const payload =
      variant === "inline"
        ? { email }
        : { email, consent };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Formulaire invalide.";
      setError(first);
      toast.error(first);
      return;
    }

    // Anti-doublon UI --------------------------------------------------------
    if (alreadySubscribed(email)) {
      toast.info("Vous êtes déjà inscrit à la newsletter KAZA.");
      setDone(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await subscribeNewsletter({
        email: email.trim().toLowerCase(),
        consent: true,
        source,
      });

      if (!res.success) {
        const msg = res.error ?? "Inscription impossible. Réessayez plus tard.";
        setError(msg);
        toast.error(msg);
        return;
      }

      markSubscribed(email);
      toast.success(
        "Inscription confirmée. Vous recevrez nos meilleures annonces.",
      );
      setDone(true);
      setEmail("");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue. Réessayez.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // =========================================================================
  // Variante INLINE
  // =========================================================================
  if (variant === "inline") {
    return (
      <form
        onSubmit={onSubmit}
        className={cn(
          "flex w-full flex-col gap-2 sm:flex-row sm:items-center",
          className,
        )}
        aria-label="Inscription à la newsletter KAZA"
      >
        <div className="relative flex-1">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting || done}
            className="pl-9"
            aria-label="Adresse email"
            aria-invalid={error ? true : undefined}
          />
        </div>
        <Button
          type="submit"
          disabled={submitting || done}
          className="bg-kaza-blue text-white hover:bg-kaza-navy"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Envoi…
            </>
          ) : done ? (
            "Inscrit ✓"
          ) : (
            <>
              <Send className="mr-2 size-4" />
              S&apos;abonner
            </>
          )}
        </Button>
      </form>
    );
  }

  // =========================================================================
  // Variante BLOCK
  // =========================================================================
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm",
        className,
      )}
      aria-label="Inscription à la newsletter KAZA"
    >
      <div>
        <h3 className="font-heading text-lg font-semibold text-kaza-navy">
          Restez informé des meilleures annonces
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Recevez chaque semaine notre sélection de biens et analyses du
          marché béninois.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="newsletter-email" className="text-sm font-medium">
          Adresse email
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="newsletter-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting || done}
            className="pl-9"
            aria-invalid={error ? true : undefined}
          />
        </div>
      </div>

      <label
        htmlFor="newsletter-consent"
        className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-muted-foreground"
      >
        <input
          id="newsletter-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={submitting || done}
          className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-gray-300 text-kaza-blue focus:ring-kaza-blue"
        />
        <span>
          J&apos;accepte de recevoir la newsletter KAZA et la{" "}
          <a
            href="/legal/confidentialite"
            className="underline hover:text-kaza-blue"
          >
            politique de confidentialité
          </a>
          . Désinscription possible à tout moment.
        </span>
      </label>

      {error && (
        <p className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting || done}
        className="w-full bg-kaza-blue text-white hover:bg-kaza-navy"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Inscription en cours…
          </>
        ) : done ? (
          "Vous êtes inscrit ✓"
        ) : (
          <>
            <Send className="mr-2 size-4" />
            S&apos;abonner à la newsletter
          </>
        )}
      </Button>
    </form>
  );
}
