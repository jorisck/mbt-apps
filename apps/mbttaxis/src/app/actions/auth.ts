"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "@mbt/api-client/auth";
import { setSession, clearSession, getSession } from "../../lib/auth-session";

export type AuthState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function authClient() {
  return createAuthClient({
    baseUrl: process.env.API_URL ?? "http://api.localhost:8000",
    apiKey: process.env.API_BFF_KEY,
  });
}

function apiErrorToState(detail: string): AuthState {
  return { ok: false, message: detail };
}

// ─── Inscription ───────────────────────────────────────────────────────────

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";
  const first_name = (formData.get("first_name") as string | null)?.trim() ?? "";
  const last_name = (formData.get("last_name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";

  const errors: Record<string, string[]> = {};
  if (!email) errors.email = ["Adresse e-mail requise."];
  if (!password || password.length < 8) errors.password = ["Au moins 8 caractères."];
  if (password !== confirm) errors.confirm = ["Les mots de passe ne correspondent pas."];
  if (!first_name) errors.first_name = ["Prénom requis."];
  if (!last_name) errors.last_name = ["Nom requis."];
  if (!phone) errors.phone = ["Numéro de téléphone requis."];
  if (Object.keys(errors).length) return { ok: false, errors };

  const result = await authClient().register({
    email,
    password,
    first_name,
    last_name,
    phone,
    language: "fr",
  });

  if (!result.ok) return apiErrorToState(result.error.detail);
  return { ok: true, message: result.data.message };
}

// ─── Connexion ─────────────────────────────────────────────────────────────

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password) {
    return { ok: false, message: "E-mail et mot de passe requis." };
  }

  const result = await authClient().login({ email, password, device_label: "site_mbt" });
  if (!result.ok) return apiErrorToState(result.error.detail);

  await setSession({ a: result.data.access_token, r: result.data.refresh_token });
  redirect("/compte");
}

// ─── Déconnexion ───────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const session = await getSession();
  if (session) {
    // Best-effort : révoque le jeton côté serveur
    await authClient().logout(session.r).catch(() => {});
    await clearSession();
  }
  redirect("/");
}

// ─── Mot de passe oublié ───────────────────────────────────────────────────

export async function forgotPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  if (!email) return { ok: false, message: "Adresse e-mail requise." };

  // L'API répond toujours avec succès (ne révèle pas si l'e-mail existe).
  await authClient().forgotPassword(email);
  return {
    ok: true,
    message: "Si cette adresse est connue, un e-mail a été envoyé.",
  };
}

// ─── Réinitialisation du mot de passe ──────────────────────────────────────

export async function resetPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = (formData.get("token") as string | null) ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  if (!token) return { ok: false, message: "Jeton manquant." };
  const errors: Record<string, string[]> = {};
  if (!password || password.length < 8) errors.password = ["Au moins 8 caractères."];
  if (password !== confirm) errors.confirm = ["Les mots de passe ne correspondent pas."];
  if (Object.keys(errors).length) return { ok: false, errors };

  const result = await authClient().resetPassword({ token, password });
  if (!result.ok) return apiErrorToState(result.error.detail);
  return { ok: true, message: result.data.message };
}
