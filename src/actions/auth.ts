"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LoginFormData, SignupFormData, ForgotPasswordFormData } from "@/validators/auth";

type AuthResult = {
  error?: string;
  success?: boolean;
};

export async function login(data: LoginFormData): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message,
    };
  }

  redirect("/dashboard");
}

export async function signup(data: SignupFormData): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        phone: data.phone,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Un compte avec cette adresse email existe deja." };
    }
    return { error: error.message };
  }

  redirect("/login?confirmed=pending");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPassword(
  data: ForgotPasswordFormData
): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
