"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { subscribeNewsletter } from "@/actions/newsletter";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

// =============================================================================
// InlineNewsletter — formulaire newsletter en ligne (pilule), thémable.
// Câblé sur la server action `subscribeNewsletter` (insert + emails Resend)
// avec retour toast, sans rechargement. Utilisé partout où une barre
// d'inscription compacte est présente (footer, landing, CTA marketing).
//
// Remplace les anciens formulaires bruts non câblés (landing) ou postant vers
// une route inexistante (footer /api/newsletter).
// =============================================================================

type Theme = "light" | "dark";

const THEME = {
  light: {
    input:
      "border-gray-200 bg-white text-kaza-navy placeholder:text-slate-400 focus:border-kaza-blue focus:ring-2 focus:ring-kaza-blue/20",
    button: "bg-kaza-navy text-white hover:bg-kaza-navy/90",
  },
  dark: {
    input:
      "border-white/20 bg-white/10 text-white placeholder:text-white/50 backdrop-blur focus:border-kaza-green",
    button: "bg-kaza-green text-white hover:bg-kaza-green/90",
  },
} satisfies Record<Theme, { input: string; button: string }>;

interface InlineNewsletterProps {
  source: string;
  theme?: Theme;
  className?: string;
  /** Libellé du bouton (défaut : « S'abonner »). */
  cta?: string;
}

export function InlineNewsletter({
  source,
  theme = "light",
  className,
  cta = "S'abonner",
}: InlineNewsletterProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const styles = THEME[theme];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      toast.error("Adresse email invalide.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await subscribeNewsletter({ email: value, source });
      if (res.success) {
        toast.success(
          res.message ??
            "Inscription confirmée. Vous recevrez nos meilleures annonces.",
        );
        setDone(true);
        setEmail("");
      } else {
        toast.error(res.error ?? "Inscription impossible. Réessayez.");
      }
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex w-full flex-col gap-3 sm:flex-row", className)}
      aria-label="Inscription à la newsletter KAZA"
    >
      <input
        type="email"
        name="email"
        required
        placeholder="votre@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting || done}
        aria-label="Adresse email"
        className={cn(
          "flex-1 rounded-full border px-5 py-3 text-sm outline-none transition disabled:opacity-60",
          styles.input,
        )}
      />
      <button
        type="submit"
        disabled={submitting || done}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition disabled:opacity-70",
          styles.button,
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Envoi…
          </>
        ) : done ? (
          "Inscrit ✓"
        ) : (
          cta
        )}
      </button>
    </form>
  );
}
