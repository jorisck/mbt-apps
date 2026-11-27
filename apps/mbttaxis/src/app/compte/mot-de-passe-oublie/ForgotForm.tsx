"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword, type AuthState } from "../../actions/auth";

const initial: AuthState = { ok: false };

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPassword, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-border bg-soft p-6 text-center">
        <i className="fa fa-envelope-o mb-3 text-3xl text-brand" aria-hidden />
        <p className="text-body">{state.message}</p>
        <Link href="/compte/connexion" className="btn btn-primary mt-6 inline-block">
          Retour à la connexion
        </Link>
      </div>
    );
  }

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

      {state.message && !state.ok && (
        <p className="form-error !mt-3">{state.message}</p>
      )}

      <button type="submit" className="btn btn-primary w-full !mt-6" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer le lien"}
      </button>

      <div className="mt-4 text-center">
        <Link href="/compte/connexion" className="text-sm text-brand hover:underline">
          ← Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
