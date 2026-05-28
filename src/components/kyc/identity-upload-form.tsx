// =============================================================================
// KAZA — IdentityUploadForm (alias)
//
// Wrapper de compatibilité : ré-exporte le composant `VerificationWizard`
// (3 étapes : téléphone OTP → pièces → selfie) sous le nom `IdentityUploadForm`
// pour les call sites qui attendent ce nom. Le wizard reste la source de
// vérité et est déjà câblé sur les Server Actions `requestPhoneOtp`,
// `verifyPhoneOtp`, `uploadIdentityFile`, `submitIdentityVerification`.
// =============================================================================

"use client";

import { VerificationWizard } from "@/app/(dashboard)/verify-identity/verification-wizard";

export function IdentityUploadForm() {
  return <VerificationWizard />;
}

export default IdentityUploadForm;
