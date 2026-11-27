"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type AuthState } from "../../actions/auth";

const initial: AuthState = { ok: false };

export function InscriptionForm() {
  const [state, action, pending] = useActionState(register, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-border bg-soft p-6 text-center">
        <i className="fa fa-envelope-o mb-3 text-3xl text-brand" aria-hidden />
        <h2 className="text-lg font-semibold text-ink">Vérifiez votre e-mail</h2>
        <p className="mt-2 text-body text-sm">{state.message}</p>
        <p className="mt-4 text-sm text-body">
          Une fois l'adresse vérifiée,{" "}
          <Link href="/compte/connexion" className="text-brand hover:underline">
            connectez-vous
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-1">
      <div className="form-fields-pair grid gap-3 md:grid-cols-2">
        <div className="form-field">
          <label htmlFor="first_name">Prénom *</label>
          <input id="first_name" name="first_name" required autoComplete="given-name" />
          {state.errors?.first_name?.[0] && (
            <p className="form-error">{state.errors.first_name[0]}</p>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="last_name">Nom *</label>
          <input id="last_name" name="last_name" required autoComplete="family-name" />
          {state.errors?.last_name?.[0] && (
            <p className="form-error">{state.errors.last_name[0]}</p>
          )}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="phone">Téléphone *</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+32 4XX XX XX XX"
        />
        {state.errors?.phone?.[0] && <p className="form-error">{state.errors.phone[0]}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="email">Adresse e-mail *</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.be"
        />
        {state.errors?.email?.[0] && <p className="form-error">{state.errors.email[0]}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="password">Mot de passe *</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          placeholder="8 caractères minimum"
        />
        {state.errors?.password?.[0] && <p className="form-error">{state.errors.password[0]}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="confirm">Confirmer le mot de passe *</label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
        />
        {state.errors?.confirm?.[0] && <p className="form-error">{state.errors.confirm[0]}</p>}
      </div>

      {state.message && !state.ok && (
        <p className="form-error !mt-3">{state.message}</p>
      )}

      <button type="submit" className="btn btn-primary w-full !mt-6" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
