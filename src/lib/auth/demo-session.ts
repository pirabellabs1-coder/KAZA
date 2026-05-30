// =============================================================================
// KAZA - Demo Session (cookie signé, compatible Edge Runtime)
//
// Quand aucun Supabase n'est branché, on garde une vraie sensation de "compte
// connecté" via un cookie httpOnly signé HMAC-SHA256 (Web Crypto API,
// compatible Edge Runtime — pas de node:crypto).
//
// Le cookie est signé pour qu'un utilisateur ne puisse pas se promouvoir
// admin en bidouillant son contenu côté navigateur.
// =============================================================================

export const DEMO_SESSION_COOKIE = "kaza-demo-session";
export const DEMO_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export type DemoRole = "OWNER" | "TENANT" | "STUDENT" | "AGENCY" | "ADMIN";

export interface DemoSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: DemoRole;
  phone?: string;
  createdAt: number;
}

function getSecret(): string {
  return (
    process.env.DEMO_SESSION_SECRET ??
    "kaza-demo-secret-do-not-use-in-real-prod-32b"
  );
}

// ---------------------------------------------------------------------------
// Base64URL helpers (Edge-safe — pas de Buffer)
// ---------------------------------------------------------------------------

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(binary)
      : Buffer.from(binary, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(str: string): Uint8Array<ArrayBuffer> {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  const binary =
    typeof atob !== "undefined"
      ? atob(b64)
      : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function stringToBytes(str: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(str) as Uint8Array<ArrayBuffer>;
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 via SubtleCrypto
// ---------------------------------------------------------------------------

let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  cachedKey = await crypto.subtle.importKey(
    "raw",
    stringToBytes(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return cachedKey;
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, stringToBytes(payload));
  return bytesToBase64Url(new Uint8Array(sig));
}

async function verify(payload: string, signature: string): Promise<boolean> {
  try {
    const key = await getKey();
    const sigBytes = base64UrlToBytes(signature);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      stringToBytes(payload),
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Encode / decode
// ---------------------------------------------------------------------------

export async function encodeDemoSession(session: DemoSession): Promise<string> {
  const json = JSON.stringify(session);
  const payload = bytesToBase64Url(stringToBytes(json));
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function decodeDemoSession(
  raw: string | undefined | null,
): Promise<DemoSession | null> {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;

  const ok = await verify(payload, signature);
  if (!ok) return null;

  try {
    const decoded = bytesToString(base64UrlToBytes(payload));
    const parsed = JSON.parse(decoded) as DemoSession;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.role !== "string" ||
      !["OWNER", "TENANT", "STUDENT", "AGENCY", "ADMIN"].includes(parsed.role)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Génère un id démo déterministe basé sur l'email.
 * Utilise SubtleCrypto.digest pour rester Edge-safe.
 */
export async function deriveDemoUserId(email: string): Promise<string> {
  const data = stringToBytes(`kaza-demo-id:${email.trim().toLowerCase()}`);
  const digest = await crypto.subtle.digest("SHA-1", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return `demo-${hex.slice(0, 12)}`;
}
