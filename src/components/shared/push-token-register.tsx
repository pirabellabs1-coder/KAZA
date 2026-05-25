"use client";

// =============================================================================
// KAZA - Push Token Register (Client)
// Wave 4 - Aminata Traore
//
// Banniere "mount-on-demand" qui demande la permission notifications et
// enregistre le token push dans `user_push_tokens` (via Server Action).
//
// Comportement :
//  - Ne rend rien si `window.Notification` est absent (SSR / vieux browsers).
//  - Ne rend rien si l'utilisateur a deja accorde OU refuse explicitement.
//  - Ne rend rien si l'utilisateur a deja repondu a la banniere (localStorage).
//  - Affiche une banniere flottante (au-dessus du bottom-nav) sinon.
//
// Strategie Firebase :
//  - On tente un import dynamique de `firebase/messaging` pour recuperer un
//    vrai token FCM. Si le package n'est pas installe, on bascule sur un
//    fallback "browser-notification-only" (l'envoi push reel ne fonctionnera
//    pas, mais la permission native est conservee et le flux ne casse pas).
// =============================================================================

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { registerPushToken } from "@/actions/push-tokens";

const LOCAL_STORAGE_KEY = "kaza-push-asked";

type BannerState = "hidden" | "visible" | "requesting";

export function PushTokenRegister() {
  const [state, setState] = useState<BannerState>("hidden");

  useEffect(() => {
    // Verifications cote client uniquement (Notification n'existe pas en SSR).
    if (typeof window === "undefined") return;
    if (typeof window.Notification === "undefined") return;

    // L'utilisateur a deja repondu (Allow ou Block au niveau du browser).
    if (Notification.permission !== "default") return;

    // L'utilisateur a deja vu (et probablement dismiss) la banniere.
    if (window.localStorage.getItem(LOCAL_STORAGE_KEY) === "1") return;

    setState("visible");
  }, []);

  const markAsked = () => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, "1");
    } catch {
      // localStorage indisponible (mode privacy, quota...) - on ignore.
    }
  };

  const handleDismiss = () => {
    markAsked();
    setState("hidden");
  };

  const handleEnable = async () => {
    setState("requesting");
    markAsked();

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setState("hidden");
        return;
      }

      // Tentative d'obtention d'un vrai token FCM via Firebase Messaging.
      // L'import est dynamique pour eviter l'echec de build si le package
      // n'est pas installe (le code est tree-shake en cas d'absence).
      let token = "browser-notification-only";

      try {
        const firebaseConfig = readFirebaseConfig();
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

        if (firebaseConfig && vapidKey) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error - firebase peut ne pas etre installe (optional)
          const { initializeApp, getApps } = await import("firebase/app");
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error - idem
          const { getMessaging, getToken } = await import("firebase/messaging");

          const app =
            getApps().length === 0
              ? initializeApp(firebaseConfig)
              : getApps()[0];

          const messaging = getMessaging(app);
          const fcmToken = await getToken(messaging, { vapidKey });

          if (fcmToken) {
            token = fcmToken;
          }
        }
      } catch (err) {
        console.warn(
          "[push-token-register] Firebase indisponible, fallback browser-only",
          err
        );
      }

      // Enregistrement cote serveur (best-effort).
      await registerPushToken({ token, platform: "web" });
    } catch (err) {
      console.warn("[push-token-register] echec demande de permission", err);
    } finally {
      setState("hidden");
    }
  };

  if (state === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-label="Activation des notifications"
      className="fixed inset-x-3 bottom-[calc(64px+env(safe-area-inset-bottom)+12px)] z-50 mx-auto max-w-md animate-in slide-in-from-bottom-6 rounded-xl border border-border bg-white p-4 shadow-lg md:bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-kaza-navy text-white">
          <Bell className="size-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Activez les notifications pour ne rien manquer
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Soyez alerte des nouvelles visites, messages et paiements en temps
            reel.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={state === "requesting"}
              className="bg-kaza-blue hover:bg-kaza-blue/90"
            >
              {state === "requesting" ? "Activation…" : "Activer"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Plus tard
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Fermer"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Lit la config Firebase depuis les variables d'env publiques.
 * Retourne `null` si une seule des cles obligatoires est absente.
 */
function readFirebaseConfig(): Record<string, string> | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    messagingSenderId,
    appId,
  };
}
