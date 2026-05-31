"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import { initiateSubscriptionCheckout } from "@/actions/subscriptions";
import { cn } from "@/lib/utils";

// =============================================================================
// SubscribeButton — bouton client qui appelle `subscribeToPlan(plan)`
//
// - Si `isAuthenticated === false`, redirige vers /signup?plan=<plan>&role=...
// - Si déjà sur ce plan, désactive le bouton et affiche "Plan actuel"
// - Sinon, déclenche `subscribeToPlan` dans une transition + toast feedback
// =============================================================================

interface SubscribeButtonProps {
  plan: string;
  label: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  /** L'utilisateur courant est-il connecté ? Si non, on redirige vers /signup */
  isAuthenticated: boolean;
  /** Plan déjà actif pour le user — bouton désactivé */
  isCurrentPlan?: boolean;
  /** Route vers laquelle rediriger après succès (par défaut, on rafraîchit) */
  redirectAfterSuccess?: string;
  /** Suffixe d'URL signup, ex: "&role=owner" */
  signupRoleSuffix?: string;
  /** Libellé affiché si plan actuel (par défaut "Plan actuel") */
  currentPlanLabel?: string;
  /** Children Lucide icon prefix (rendered before label) */
  icon?: React.ReactNode;
}

export function SubscribeButton({
  plan,
  label,
  className,
  variant = "default",
  size = "default",
  isAuthenticated,
  isCurrentPlan = false,
  redirectAfterSuccess,
  signupRoleSuffix = "",
  currentPlanLabel = "Plan actuel",
  icon,
}: SubscribeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (isCurrentPlan) {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        className={cn("cursor-not-allowed opacity-80", className)}
        disabled
      >
        {currentPlanLabel}
      </Button>
    );
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push(`/signup?plan=${encodeURIComponent(plan)}${signupRoleSuffix}`);
      return;
    }

    startTransition(async () => {
      // Paiement par moyen de paiement (Mobile Money / GeniusPay) — pas besoin
      // de solde wallet. Le webhook active l'abonnement après confirmation.
      const result = await initiateSubscriptionCheckout(plan);
      if (result.success) {
        if (result.checkoutUrl) {
          toast.info("Redirection vers le paiement Mobile Money…");
          window.location.href = result.checkoutUrl;
          return;
        }
        // Plan gratuit : activé directement.
        toast.success("Abonnement activé. Bienvenue !");
        if (redirectAfterSuccess) {
          router.push(redirectAfterSuccess);
        } else {
          router.refresh();
        }
        return;
      }

      switch (result.error) {
        case "NOT_AUTHENTICATED":
          router.push(
            `/signup?plan=${encodeURIComponent(plan)}${signupRoleSuffix}`,
          );
          return;
        case "ALREADY_SUBSCRIBED":
          toast.error("Vous avez déjà un abonnement actif.");
          return;
        case "INTERNAL":
          toast.error("Une erreur interne est survenue. Réessayez.");
          return;
        default:
          toast.error(result.error ?? "Impossible d'initier le paiement.");
      }
    });
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Activation...
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </Button>
  );
}
