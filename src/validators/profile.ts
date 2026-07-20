// =============================================================================
// Kaabo - Profile Validation Schemas (Zod v4)
// Used by React Hook Form on the client and Server Actions on the server
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Update Profile
// ---------------------------------------------------------------------------

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "Le prenom doit contenir au moins 2 caracteres")
    .max(100, "Le prenom ne peut pas depasser 100 caracteres"),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .max(100, "Le nom ne peut pas depasser 100 caracteres"),
  phone: z
    .string()
    .min(8, "Le numero de telephone doit contenir au moins 8 chiffres")
    .max(20, "Le numero de telephone ne peut pas depasser 20 caracteres"),
  bio: z
    .string()
    .max(500, "La biographie ne peut pas depasser 500 caracteres")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(255, "L'adresse ne peut pas depasser 255 caracteres")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// ---------------------------------------------------------------------------
// Change Password
// ---------------------------------------------------------------------------

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Le mot de passe actuel est requis"),
    newPassword: z
      .string()
      .min(8, "Le nouveau mot de passe doit contenir au moins 8 caracteres")
      .max(128, "Le mot de passe ne peut pas depasser 128 caracteres"),
    confirmNewPassword: z
      .string()
      .min(1, "Veuillez confirmer le nouveau mot de passe"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Le nouveau mot de passe doit etre different de l'ancien",
    path: ["newPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Verification Documents Upload
// ---------------------------------------------------------------------------

export const verificationDocumentsSchema = z.object({
  documentType: z.enum(["NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE"], {
    message: "Veuillez selectionner un type de document",
  }),
  documentUrl: z
    .string()
    .min(1, "Le document d'identite est requis"),
  selfieUrl: z
    .string()
    .min(1, "Le selfie de verification est requis"),
});

export type VerificationDocumentsFormData = z.infer<typeof verificationDocumentsSchema>;
