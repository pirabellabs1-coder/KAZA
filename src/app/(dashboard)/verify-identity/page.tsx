import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyVerification } from "@/actions/verification";
import { createClient } from "@/lib/supabase/server";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";

import { VerificationWizard } from "./verification-wizard";

export const metadata = {
  title: "Vérification d'identité",
  description: "Sécurisez votre compte Kaabo en vérifiant votre identité.",
};

export default async function VerifyIdentityPage() {
  let current = null;
  try {
    current = await getMyVerification();
  } catch {
    current = null;
  }

  // Récupère le rôle (pour les documents administratifs par rôle) et l'état de
  // confirmation de l'email (source de vérité Supabase Auth).
  const displayUser = await getCurrentDisplayUser();
  let email = displayUser?.email ?? "";
  let emailConfirmed = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? email;
    emailConfirmed = Boolean(user?.email_confirmed_at);
  } catch {
    emailConfirmed = false;
  }
  const role = displayUser?.role ?? "TENANT";

  if (current?.status === "APPROVED") {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="size-9 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Identité vérifiée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Votre identité a été validée. Vous pouvez maintenant accéder à toutes
              les fonctionnalités de Kaabo.
            </p>
            <Button asChild className="bg-kaza-blue hover:bg-kaza-blue/90">
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (current?.status === "PENDING") {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Clock className="size-9 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Demande en cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Votre dossier est en cours d&apos;examen par nos équipes. Vous recevrez
              une notification dès qu&apos;il sera traité (sous 24 à 48h).
            </p>
            <p className="text-xs text-muted-foreground">
              Soumis le {new Date(current.submitted_at).toLocaleDateString("fr-FR")}
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const wasRejected = current?.status === "REJECTED";

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-kaza-blue/10">
          <ShieldCheck className="size-6 text-kaza-blue" />
        </div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          Vérification d&apos;identité
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Vos documents sont chiffrés et utilisés uniquement pour la modération.
          Cette étape est obligatoire avant de publier ou de réserver un bien.
        </p>
      </div>

      {wasRejected && current?.rejection_reason ? (
        <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <XCircle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Précédente demande rejetée</p>
            <p className="mt-1">{current.rejection_reason}</p>
            <p className="mt-2 text-xs">
              Veuillez resoumettre vos documents en tenant compte de cette remarque.
            </p>
          </div>
        </div>
      ) : null}

      <VerificationWizard
        role={role}
        email={email}
        emailConfirmed={emailConfirmed}
      />
    </div>
  );
}
