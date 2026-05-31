"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { subscribeNewsletter } from "@/actions/newsletter";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// FooterNewsletter — formulaire newsletter du pied de page (thème sombre).
// Câblé sur la server action `subscribeNewsletter` avec retour toast, sans
// rechargement de page. Remplace l'ancien <form action="/api/newsletter">
// (route inexistante → soumission cassée).
// =============================================================================

export function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      toast.error("Adresse email invalide.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await subscribeNewsletter({ email: value, source: "footer" });
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
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
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
        className="flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/50 outline-none backdrop-blur transition focus:border-kaza-green disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={submitting || done}
        className="inline-flex items-center justify-center rounded-full bg-kaza-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-kaza-green/90 disabled:opacity-70"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Envoi…
          </>
        ) : done ? (
          "Inscrit ✓"
        ) : (
          "S'abonner"
        )}
      </button>
    </form>
  );
}
