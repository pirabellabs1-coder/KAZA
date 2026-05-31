"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// KAZA — Server actions CMS Articles (rédaction enrichie + contributeurs)
// Permissions : ADMIN (tout) ou contributeur (ses propres articles).
// Les policies RLS (migration 00044) appliquent l'autorisation côté DB ;
// on les double d'une vérification applicative.
// =============================================================================

export interface ArticleResult {
  success: boolean;
  error?: string;
  id?: string;
  slug?: string;
}

export interface ArticleInput {
  title: string;
  excerpt?: string;
  content: string; // HTML enrichi (Tiptap)
  coverImageUrl?: string;
  category?: string;
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "article";
}

/** Estime le temps de lecture en minutes à partir du HTML (≈200 mots/min). */
function readMinutes(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 200));
}

/** Vérifie que l'utilisateur courant peut rédiger (admin ou contributeur). */
async function requireWriter(): Promise<
  { ok: true; userId: string; isAdmin: boolean } | { ok: false; error: string }
> {
  const user = await getCurrentDisplayUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };
  const isAdmin = user.role === "ADMIN";

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data } = await admin
    .from("users")
    .select("is_contributor")
    .eq("id", user.id)
    .maybeSingle();
  const isContributor =
    (data as { is_contributor?: boolean } | null)?.is_contributor === true;

  if (!isAdmin && !isContributor) {
    return { ok: false, error: "Réservé aux contributeurs." };
  }
  return { ok: true, userId: user.id, isAdmin };
}

export async function createArticle(
  input: ArticleInput,
): Promise<ArticleResult> {
  const guard = await requireWriter();
  if (!guard.ok) return { success: false, error: guard.error };

  const title = input.title?.trim();
  if (!title) return { success: false, error: "Le titre est requis." };

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const baseSlug = slugify(title);

  const row = {
    title,
    slug: baseSlug,
    excerpt: input.excerpt?.trim() || null,
    content: input.content ?? "",
    cover_image_url: input.coverImageUrl?.trim() || null,
    category: input.category?.trim() || null,
    status: "DRAFT",
    author_id: guard.userId,
    read_minutes: readMinutes(input.content ?? ""),
  };

  let res = await supabase.from("articles").insert(row).select("id, slug").single();
  // Collision de slug → on suffixe.
  if (res.error && (res.error as { code?: string }).code === "23505") {
    const suffix = Math.random().toString(36).slice(2, 6);
    res = await supabase
      .from("articles")
      .insert({ ...row, slug: `${baseSlug}-${suffix}` })
      .select("id, slug")
      .single();
  }

  if (res.error || !res.data) {
    return { success: false, error: res.error?.message ?? "Échec de création." };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/redaction");
  return {
    success: true,
    id: (res.data as { id: string }).id,
    slug: (res.data as { slug: string }).slug,
  };
}

export async function updateArticle(
  id: string,
  input: ArticleInput,
): Promise<ArticleResult> {
  const guard = await requireWriter();
  if (!guard.ok) return { success: false, error: guard.error };
  if (!id) return { success: false, error: "Article introuvable." };

  const title = input.title?.trim();
  if (!title) return { success: false, error: "Le titre est requis." };

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { error } = await supabase
    .from("articles")
    .update({
      title,
      excerpt: input.excerpt?.trim() || null,
      content: input.content ?? "",
      cover_image_url: input.coverImageUrl?.trim() || null,
      category: input.category?.trim() || null,
      read_minutes: readMinutes(input.content ?? ""),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
  revalidatePath("/redaction");
  revalidatePath("/blog");
  return { success: true, id };
}

export async function setArticleStatus(
  id: string,
  status: "DRAFT" | "PUBLISHED",
): Promise<ArticleResult> {
  const guard = await requireWriter();
  if (!guard.ok) return { success: false, error: guard.error };
  if (!id) return { success: false, error: "Article introuvable." };

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "PUBLISHED") patch.published_at = new Date().toISOString();

  const { error } = await supabase.from("articles").update(patch).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/articles");
  revalidatePath("/redaction");
  revalidatePath("/blog");
  return { success: true, id };
}

export async function deleteArticle(id: string): Promise<ArticleResult> {
  const guard = await requireWriter();
  if (!guard.ok) return { success: false, error: guard.error };
  if (!id) return { success: false, error: "Article introuvable." };

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/articles");
  revalidatePath("/redaction");
  revalidatePath("/blog");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Gestion des contributeurs (admin uniquement)
// ---------------------------------------------------------------------------

export async function setContributor(
  userId: string,
  value: boolean,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentDisplayUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, error: "Réservé aux administrateurs." };
  }
  if (!userId) return { success: false, error: "Utilisateur introuvable." };

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { error } = await admin
    .from("users")
    .update({ is_contributor: value })
    .eq("id", userId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/articles/contributeurs");
  return { success: true };
}
