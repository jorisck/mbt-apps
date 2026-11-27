"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword, type AuthState } from "../../actions/auth";

const initial: AuthState = { ok: false };

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-border bg-soft p-6 text-center">
        <i className="fa fa-check-circle mb-3 text-3xl text-brand" aria-hidden />
        <p className="text-body">{state.message}</p>
        <Link href="/compte/connexion" className="btn btn-primary mt-6 inline-block">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="token" value={token} />

      <div className="form-field">
        <label htmlFor="password">Nouveau mot de passe *</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          placeholder="8 caractères minimum"
        />
        {state.errors?.password?.[0] && (
          <p className="form-error">{state.errors.password[0]}</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="confirm">Confirmer *</label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
        />
        {state.errors?.confirm?.[0] && (
          <p className="form-error">{state.errors.confirm[0]}</p>
        )}
      </div>

      {state.message && !state.ok && (
        <p className="form-error !mt-3">{state.message}</p>
      )}

      <button type="submit" className="btn btn-primary w-full !mt-6" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
