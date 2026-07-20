// =============================================================================
// Kaabo — IdentityUploadForm (alias)
//
// Wrapper de compatibilité : ré-exporte le composant `VerificationWizard`
// (3 étapes : email → pièces → selfie & justificatifs) sous le nom
// `IdentityUploadForm` pour les call sites qui attendent ce nom.
//
// Le wizard exige désormais le rôle de l'utilisateur (documents administratifs
// par rôle) et l'état de confirmation de l'email. Ce wrapper est un Server
// Component qui récupère ces informations via Supabase avant de rendre le
// wizard côté client.
// =============================================================================

import { VerificationWizard } from "@/app/(dashboard)/verify-identity/verification-wizard";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export async function IdentityUploadForm() {
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

  return (
    <VerificationWizard
      role={displayUser?.role ?? "TENANT"}
      email={email}
      emailConfirmed={emailConfirmed}
    />
  );
}

export default IdentityUploadForm;
