/**
 * Session passager — stockage des jetons dans un cookie HttpOnly.
 *
 * Cookie name:
 *   - prod (HTTPS) : `__Host-client`  (préfixe __Host- impose Secure + Path=/ + pas de Domain)
 *   - local (HTTP) : `client_session` (préfixe __Host- interdit sans HTTPS)
 */
import "server-only";

import { cookies } from "next/headers";
import { createAuthClient, type ProfileOut } from "@mbt/api-client/auth";
import { redirect } from "next/navigation";

// ─── Cookie & session ──────────────────────────────────────────────────────

const IS_LOCAL =
  process.env.NODE_ENV !== "production" ||
  (process.env.API_URL ?? "").includes("localhost");

const COOKIE_NAME = IS_LOCAL ? "client_session" : "__Host-client";

export interface Session {
  /** JWT d'accès — dure ~15 min selon la config API. */
  a: string;
  /** Jeton de rafraîchissement — dure 30 jours. */
  r: string;
}

function encode(s: Session): string {
  return Buffer.from(JSON.stringify(s)).toString("base64url");
}

function decode(raw: string): Session | null {
  try {
    const obj = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (obj && typeof obj.a === "string" && typeof obj.r === "string") {
      return obj as Session;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const cookie = jar.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return decode(cookie.value);
}

export async function setSession(s: Session): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, encode(s), {
    httpOnly: true,
    secure: !IS_LOCAL,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

// ─── Auth helpers ──────────────────────────────────────────────────────────

function authClient() {
  return createAuthClient({
    baseUrl: process.env.API_URL ?? "http://api.localhost:8000",
    apiKey: process.env.API_BFF_KEY,
  });
}

/**
 * Tente de rafraîchir la session.
 * Retourne le nouveau access_token ou null si le refresh a échoué.
 */
export async function refreshSession(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const result = await authClient().refresh(session.r);
  if (!result.ok) {
    await clearSession();
    return null;
  }
  await setSession({ a: result.data.access_token, r: result.data.refresh_token });
  return result.data.access_token;
}

/**
 * Retourne le profil du passager connecté.
 * En cas de 401, essaie de rafraîchir le jeton une fois.
 * Si toujours non autorisé, retourne null.
 */
export async function getAuthenticatedProfile(): Promise<ProfileOut | null> {
  const session = await getSession();
  if (!session) return null;

  const client = authClient();
  let result = await client.getProfile(session.a);

  if (!result.ok && result.error.status === 401) {
    const newToken = await refreshSession();
    if (!newToken) return null;
    result = await client.getProfile(newToken);
  }

  if (!result.ok) return null;
  return result.data;
}

/**
 * Comme getAuthenticatedProfile() mais redirige vers /compte/connexion si non connecté.
 */
export async function requireAuth(): Promise<{ profile: ProfileOut; accessToken: string }> {
  const session = await getSession();
  if (!session) redirect("/compte/connexion");

  const client = authClient();
  let token = session.a;
  let result = await client.getProfile(token);

  if (!result.ok && result.error.status === 401) {
    const newToken = await refreshSession();
    if (!newToken) redirect("/compte/connexion");
    token = newToken;
    result = await client.getProfile(token);
  }

  if (!result.ok) redirect("/compte/connexion");
  return { profile: result.data, accessToken: token };
}
