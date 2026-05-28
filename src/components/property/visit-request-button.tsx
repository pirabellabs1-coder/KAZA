"use client";

// =============================================================================
// KAZA - VisitRequestButton (client component)
//
// Bouton "Demander une visite" + dialog associe. Si l'utilisateur n'est pas
// connecte, on redirige vers /login en preservant le retour vers la page
// detail propriete via le query param `?redirect=...`. La detection d'auth
// est passee par le serveur (`isAuthenticated`) pour eviter un flash.
// =============================================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VisitRequestDialog } from "./visit-request-dialog";

interface VisitRequestButtonProps {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  className?: string;
  variant?: "default" | "large";
  /** Auth resolue cote serveur (RSC). Optionnel : fallback cookie demo. */
  isAuthenticated?: boolean;
}

const SESSION_COOKIE = "kaza-demo-session";

function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));
}

export function VisitRequestButton({
  propertyId,
  propertyTitle,
  propertyAddress,
  ownerName,
  className,
  variant = "default",
  isAuthenticated,
}: VisitRequestButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Si l'info auth vient du serveur, on l'utilise direct (pas de flash).
  // Sinon fallback : cookie demo cote client.
  const [isAuth, setIsAuth] = useState<boolean | null>(
    isAuthenticated ?? null,
  );

  useEffect(() => {
    if (isAuthenticated !== undefined) {
      setIsAuth(isAuthenticated);
      return;
    }
    setIsAuth(hasSessionCookie());
  }, [isAuthenticated]);

  const handleClick = () => {
    if (isAuth === false) {
      const redirectTo = `/properties/${propertyId}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }
    setOpen(true);
  };

  const isLarge = variant === "large";

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        className={cn(
          "bg-kaza-blue hover:bg-kaza-blue/90",
          isLarge && "h-12 w-full text-base font-semibold",
          className,
        )}
      >
        <Calendar className={cn("mr-1.5", isLarge ? "size-5" : "size-4")} />
        Demander une visite
      </Button>

      <VisitRequestDialog
        open={open}
        onOpenChange={setOpen}
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        propertyAddress={propertyAddress}
        ownerName={ownerName}
      />
    </>
  );
}
