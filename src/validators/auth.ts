// =============================================================================
// KAZA - Authentication Validation Schemas (Zod v4)
// Used by React Hook Form on the client and Server Actions on the server
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email("Veuillez entrer une adresse email valide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------

export const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Le prenom doit contenir au moins 2 caracteres")
      .max(100, "Le prenom ne peut pas depasser 100 caracteres"),
    lastName: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caracteres")
      .max(100, "Le nom ne peut pas depasser 100 caracteres"),
    email: z
      .string()
      .min(1, "L'adresse email est requise")
      .email("Veuillez entrer une adresse email valide"),
    phone: z
      .string()
      .min(8, "Le numero de telephone doit contenir au moins 8 chiffres")
      .max(20, "Le numero de telephone ne peut pas depasser 20 caracteres"),
    // Pays (ISO alpha-2) choisi via le sélecteur du champ téléphone.
    country: z
      .string()
      .length(2, "Veuillez sélectionner votre pays"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
      .max(128, "Le mot de passe ne peut pas depasser 128 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "Veuillez confirmer votre mot de passe"),
    role: z.enum(["OWNER", "TENANT", "STUDENT", "AGENCY"], {
      message: "Veuillez selectionner un role valide",
    }),
    // Champ optionnel : nom de l'agence (uniquement si role === 'AGENCY')
    agencyName: z
      .string()
      .max(100, "Le nom de l'agence ne peut pas depasser 100 caracteres")
      .optional(),
    // Champ optionnel : code de parrainage saisi a l'inscription
    referralCode: z
      .string()
      .trim()
      .min(4, "Le code de parrainage est trop court")
      .max(16, "Le code de parrainage est trop long")
      .regex(
        /^[A-Za-z0-9]+$/,
        "Le code de parrainage ne contient que des lettres et chiffres",
      )
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

// ---------------------------------------------------------------------------
// Forgot Password
// ---------------------------------------------------------------------------

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email("Veuillez entrer une adresse email valide"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ---------------------------------------------------------------------------
// Reset Password (used on the reset password page after clicking email link)
// ---------------------------------------------------------------------------

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
      .max(128, "Le mot de passe ne peut pas depasser 128 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "Veuillez confirmer votre mot de passe"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
