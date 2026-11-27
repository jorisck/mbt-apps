/**
 * Typed HTTP client for /v1/auth/* and /v1/me/* endpoints.
 * These routes are not in the generated OpenAPI schema → plain typed fetch.
 *
 * Usage (server-side):
 *   import { createAuthClient } from "@mbt/api-client/auth";
 *   const auth = createAuthClient({ baseUrl: process.env.API_URL!, apiKey: process.env.API_BFF_KEY });
 */

// ─── Shared types ──────────────────────────────────────────────────────────

export interface TokenOut {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ProfileOut {
  id: string;
  email: string;
  email_verified: boolean;
  first_name: string;
  last_name: string;
  phone: string;
  language: string;
  default_needs: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

export interface DemandeOut {
  id: string;
  reference: string;
  status: string;
  service: string;
  pickup_at: string;
  pickup_address: Record<string, unknown>;
  dropoff_address: Record<string, unknown>;
  return_at: string | null;
  passenger_count: number;
  refusal_reason: string | null;
  cancellation_reason: string | null;
  revision: number;
  created_at: string;
}

export interface DemandeListOut {
  items: DemandeOut[];
  next_cursor: string | null;
}

export interface AuthApiError {
  status: number;
  detail: string;
  code?: string;
}

export type AuthResult<T> =
  | { ok: true; data: T; error?: never }
  | { ok: false; data?: never; error: AuthApiError };

// ─── Client factory ────────────────────────────────────────────────────────

export function createAuthClient(options: { baseUrl: string; apiKey?: string }) {
  const base = options.baseUrl.replace(/\/$/, "");
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.apiKey ? { "X-Client-Key": options.apiKey } : {}),
  };

  async function req<T>(
    path: string,
    opts?: {
      method?: string;
      body?: unknown;
      bearer?: string;
    },
  ): Promise<AuthResult<T>> {
    const headers: Record<string, string> = { ...baseHeaders };
    if (opts?.bearer) headers["Authorization"] = `Bearer ${opts.bearer}`;

    try {
      const res = await fetch(`${base}${path}`, {
        method: opts?.method ?? "GET",
        headers,
        body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
        cache: "no-store",
      });

      if (res.status === 204) {
        return { ok: true, data: undefined as T };
      }

      let json: unknown;
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok) {
        const err = json as Record<string, unknown>;
        return {
          ok: false,
          error: {
            status: res.status,
            detail: (err?.detail as string) || `Erreur serveur (${res.status}).`,
            code: (err?.code as string) || undefined,
          },
        };
      }

      return { ok: true, data: json as T };
    } catch {
      return {
        ok: false,
        error: { status: 0, detail: "Impossible de contacter le serveur." },
      };
    }
  }

  return {
    /** Inscription passager — envoie un e-mail de vérification. */
    register(body: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      phone: string;
      language?: string;
    }) {
      return req<{ message: string }>("/v1/auth/register", {
        method: "POST",
        body,
      });
    },

    /** Vérification de l'adresse e-mail via le jeton reçu par e-mail. */
    verifyEmail(token: string) {
      return req<{ message: string }>("/v1/auth/verify-email", {
        method: "POST",
        body: { token },
      });
    },

    /** Connexion — retourne une paire de jetons. */
    login(body: { email: string; password: string; device_label?: string }) {
      return req<TokenOut>("/v1/auth/token", { method: "POST", body });
    },

    /** Rotation du jeton de rafraîchissement. */
    refresh(refresh_token: string) {
      return req<TokenOut>("/v1/auth/refresh", {
        method: "POST",
        body: { refresh_token },
      });
    },

    /** Révocation de la famille de jetons (déconnexion). */
    logout(refresh_token: string) {
      return req<void>("/v1/auth/logout", {
        method: "POST",
        body: { refresh_token },
      });
    },

    /** Demande de réinitialisation du mot de passe. */
    forgotPassword(email: string) {
      return req<{ message: string }>("/v1/auth/password/forgot", {
        method: "POST",
        body: { email },
      });
    },

    /** Réinitialisation du mot de passe avec le jeton reçu par e-mail. */
    resetPassword(body: { token: string; password: string }) {
      return req<{ message: string }>("/v1/auth/password/reset", {
        method: "POST",
        body,
      });
    },

    /** Profil du passager connecté. */
    getProfile(access_token: string) {
      return req<ProfileOut>("/v1/me", { bearer: access_token });
    },

    /** Liste des demandes du passager (paginated cursor). */
    listDemandes(
      access_token: string,
      opts?: { scope?: "upcoming" | "past"; cursor?: string; limit?: number },
    ) {
      const params = new URLSearchParams();
      if (opts?.scope) params.set("scope", opts.scope);
      if (opts?.cursor) params.set("cursor", opts.cursor);
      if (opts?.limit !== undefined) params.set("limit", String(opts.limit));
      const qs = params.toString();
      return req<DemandeListOut>(`/v1/me/demandes${qs ? `?${qs}` : ""}`, {
        bearer: access_token,
      });
    },

    /** Détail d'une demande du passager. */
    getDemande(access_token: string, demande_id: string) {
      return req<DemandeOut>(`/v1/me/demandes/${demande_id}`, {
        bearer: access_token,
      });
    },
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
