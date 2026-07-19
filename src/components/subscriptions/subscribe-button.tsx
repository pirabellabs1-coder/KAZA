"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MomoPaymentPanel } from "@/components/payments/momo-payment-panel";
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
  /** Prix mensuel du plan en FCFA (affichage dans le tunnel de paiement). */
  priceFcfa?: number;
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
  priceFcfa = 0,
}: SubscribeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
    // Plan gratuit : activation directe (l'action ignore les champs Mobile Money
    // pour un plan à 0 FCFA). Sinon, on ouvre le tunnel de paiement on-page.
    if (priceFcfa <= 0) {
      void activateFree();
      return;
    }
    setOpen(true);
  };

  const activateFree = async () => {
    const result = await initiateSubscriptionCheckout(plan, {
      network: "",
      phone: "",
    });
    if (result.success) {
      toast.success("Abonnement activé. Bienvenue !");
      if (redirectAfterSuccess) router.push(redirectAfterSuccess);
      else router.refresh();
      return;
    }
    if (result.error === "ALREADY_SUBSCRIBED") {
      toast.error("Vous avez déjà un abonnement actif.");
    } else {
      toast.error(result.error ?? "Impossible d'activer l'abonnement.");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
      >
        {icon}
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Activer mon abonnement
            </DialogTitle>
            <DialogDescription>
              Payez par Mobile Money et validez directement sur votre téléphone.
              Votre abonnement est activé dès la confirmation.
            </DialogDescription>
          </DialogHeader>
          <MomoPaymentPanel
            amount={priceFcfa}
            initiate={(momo) => initiateSubscriptionCheckout(plan, momo)}
            onSuccess={() => {
              toast.success("Abonnement activé. Bienvenue !");
              setOpen(false);
              if (redirectAfterSuccess) router.push(redirectAfterSuccess);
              else router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
