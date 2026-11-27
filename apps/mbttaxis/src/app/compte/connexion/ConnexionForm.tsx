"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthState } from "../../actions/auth";

const initial: AuthState = { ok: false };

export function ConnexionForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="space-y-1">
      <div className="form-field">
        <label htmlFor="email">Adresse e-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.be"
        />
      </div>

      <div className="form-field">
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      <div className="flex justify-end">
        <Link href="/compte/mot-de-passe-oublie" className="text-sm text-brand hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>

      {state.message && !state.ok && (
        <p className="form-error !mt-3">{state.message}</p>
      )}

      <button type="submit" className="btn btn-primary w-full !mt-6" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
