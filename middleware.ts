import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { updateSession } from "@/lib/supabase/middleware";
import type { Database } from "@/types/supabase";

type Role = "OWNER" | "TENANT" | "STUDENT" | "AGENCY" | "BUYER" | "ADMIN";

/**
 * Routes nécessitant uniquement une authentification (toutes rôles confondus).
 */
const protectedPrefixes = [
  "/owner",
  "/tenant",
  "/student",
  "/agency",
  "/admin",
  "/dashboard",
  "/profile",
  "/settings",
  "/messages",
  // Espace acheteur (offres d'achat) — accessible à tout utilisateur connecté,
  // sans restriction de rôle (pas d'entrée dans ROLE_RULES).
  "/buyer",
  // Pages (dashboard) accessibles à tout utilisateur connecté (pas de
  // restriction de rôle) : garde autoritaire au middleware (307 → /login)
  // en plus de l'auto-protection de chaque page.
  "/contracts",
  "/notifications",
  "/verify-identity",
  "/achievements",
  "/points",
  "/referral",
  "/reports",
  "/surveys",
  "/membre-plus",
];

/**
 * Contrôle d'accès par rôle. La clé est un préfixe de chemin,
 * la valeur est la liste des rôles autorisés à l'atteindre.
 */
const ROLE_RULES: Record<string, Role[]> = {
  // Une agence gère un portefeuille de biens : elle a les mêmes droits qu'un
  // propriétaire sur la gestion des annonces, visites, locataires, paiements.
  "/owner": ["OWNER", "AGENCY", "ADMIN"],
  // Un étudiant peut aussi louer un logement classique (pas seulement une
  // colocation) : il accède donc aux pages locataire (favoris, visites,
  // candidatures, locations, paiement du loyer).
  // Un acheteur réutilise les pages conso partagées (favoris, visites,
  // portefeuille) en plus de son espace /buyer.
  "/tenant": ["TENANT", "STUDENT", "BUYER", "ADMIN"],
  "/student": ["STUDENT", "ADMIN"],
  "/agency": ["AGENCY", "ADMIN"],
  "/admin": ["ADMIN"],
};

/**
 * Cookie de cache pour le rôle (évite une requête DB par requête).
 * Durée volontairement courte : un changement de rôle est rapidement répercuté.
 */
const ROLE_COOKIE = "kaza-role";
const ROLE_COOKIE_MAX_AGE = 60 * 5; // 5 minutes

// Cache court du flag maintenance pour éviter une requête DB par requête.
const MAINT_COOKIE = "kaza-maint";
const MAINT_COOKIE_MAX_AGE = 30; // 30 secondes

function isProtectedRoute(pathname: string): boolean {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Lit le flag `maintenanceMode` depuis platform_settings (service role).
 * Renvoie null si indéterminable (pas de blocage en cas de doute).
 */
async function fetchMaintenanceMode(): Promise<boolean | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", "maintenance")
      .maybeSingle();
    if (error) return null;
    const value = (data?.value ?? {}) as { maintenanceMode?: boolean };
    return Boolean(value.maintenanceMode);
  } catch {
    return null;
  }
}

// Chemins toujours accessibles même en maintenance.
function isMaintenanceExempt(pathname: string): boolean {
  return (
    pathname === "/maintenance" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js"
  );
}

function matchedRule(pathname: string): Role[] | null {
  for (const [prefix, allowed] of Object.entries(ROLE_RULES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return allowed;
    }
  }
  return null;
}

function isRole(value: unknown): value is Role {
  return (
    value === "OWNER" ||
    value === "TENANT" ||
    value === "STUDENT" ||
    value === "AGENCY" ||
    value === "BUYER" ||
    value === "ADMIN"
  );
}

/**
 * Récupère le rôle d'un utilisateur :
 *   1. d'abord depuis `user_metadata.role` (renseigné à l'inscription) ;
 *   2. sinon depuis un cookie cache court ;
 *   3. en dernier recours via une requête DB côté serveur (admin client).
 *
 * Renvoie `null` si le rôle ne peut pas être résolu (utilisateur sans profil DB).
 */
async function resolveUserRole(
  userId: string,
  metadataRole: unknown,
  cookieRole: string | undefined
): Promise<Role | null> {
  if (isRole(metadataRole)) return metadataRole;
  if (cookieRole && isRole(cookieRole)) return cookieRole;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return isRole(data.role) ? data.role : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------------------------------------------------------------------------
  // FLUX SUPABASE LIVE
  // ---------------------------------------------------------------------------
  // 1. Rafraîchit la session (gère la rotation des cookies Supabase)
  const response = await updateSession(request);

  // ---------------------------------------------------------------------------
  // MODE MAINTENANCE
  // Si activé dans platform_settings, on redirige tout le monde vers
  // /maintenance SAUF les admins (qui doivent pouvoir le désactiver) et les
  // chemins exemptés (login, api, assets). Cache cookie 30s pour la perf.
  // ---------------------------------------------------------------------------
  if (!isMaintenanceExempt(pathname)) {
    const cached = request.cookies.get(MAINT_COOKIE)?.value;
    let maintenanceOn: boolean | null;
    if (cached === "1") maintenanceOn = true;
    else if (cached === "0") maintenanceOn = false;
    else {
      maintenanceOn = await fetchMaintenanceMode();
      if (maintenanceOn !== null) {
        response.cookies.set(MAINT_COOKIE, maintenanceOn ? "1" : "0", {
          sameSite: "lax",
          path: "/",
          maxAge: MAINT_COOKIE_MAX_AGE,
        });
      }
    }

    if (maintenanceOn) {
      // Les admins passent (pour pouvoir désactiver la maintenance).
      const cookieRole = request.cookies.get(ROLE_COOKIE)?.value;
      let isAdmin = cookieRole === "ADMIN";
      if (!isAdmin) {
        const supabaseCheck = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll() {},
            },
          }
        );
        const {
          data: { user: maintUser },
        } = await supabaseCheck.auth.getUser();
        if (maintUser) {
          const r = await resolveUserRole(
            maintUser.id,
            maintUser.user_metadata?.role,
            cookieRole
          );
          isAdmin = r === "ADMIN";
        }
      }
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/maintenance", request.url));
      }
    }
  }

  if (!isProtectedRoute(pathname)) {
    return response;
  }

  // 2. Lit l'utilisateur courant à partir des cookies (potentiellement rafraîchis)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No-op : updateSession a déjà écrit les cookies sur `response`.
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Contrôle de rôle si la route est rattachée à une règle
  const allowedRoles = matchedRule(pathname);
  if (allowedRoles) {
    const cookieRole = request.cookies.get(ROLE_COOKIE)?.value;
    const role = await resolveUserRole(
      user.id,
      user.user_metadata?.role,
      cookieRole
    );

    if (!role) {
      // Rôle introuvable : on renvoie vers le dashboard générique.
      const url = new URL("/dashboard", request.url);
      url.searchParams.set(
        "erreur",
        "Profil incomplet : rôle utilisateur introuvable."
      );
      return NextResponse.redirect(url);
    }

    if (!allowedRoles.includes(role)) {
      const url = new URL("/dashboard", request.url);
      url.searchParams.set(
        "erreur",
        "Accès refusé : vous n'avez pas les droits pour cette section."
      );
      return NextResponse.redirect(url);
    }

    // Met à jour le cookie cache (courte durée) si nécessaire.
    if (cookieRole !== role) {
      response.cookies.set(ROLE_COOKIE, role, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: ROLE_COOKIE_MAX_AGE,
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - Images and other static assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
