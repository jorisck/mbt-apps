"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type AuthState } from "../../actions/auth";

const initial: AuthState = { ok: false };

const inputClass =
  "h-12 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 text-[14px] text-brand-dark transition-all placeholder:text-slate-400 focus:border-brand-dark focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,205,26,0.25)]";

const errorClass = "mt-1 text-[12px] text-red-600";

export function InscriptionForm() {
  const [state, action, pending] = useActionState(register, initial);

  if (state.ok) {
    return (
      <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <i className="fa fa-envelope-o text-2xl text-emerald-600" aria-hidden />
        </div>
        <h2 className="text-[20px] font-bold text-brand-dark">Vérifiez votre e-mail</h2>
        <p className="mt-2 text-[14px] text-slate-600">{state.message}</p>
        <Link
          href="/compte/connexion"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal hover:bg-brand-yellow-dark transition-colors"
        >
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input className={inputClass} name="first_name" required autoComplete="given-name" />
          {state.errors?.first_name?.[0] && (
            <p className={errorClass}>{state.errors.first_name[0]}</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Nom <span className="text-red-500">*</span>
          </label>
          <input className={inputClass} name="last_name" required autoComplete="family-name" />
          {state.errors?.last_name?.[0] && (
            <p className={errorClass}>{state.errors.last_name[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Téléphone <span className="text-red-500">*</span>
        </label>
        <input
          className={inputClass}
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+32 4XX XX XX XX"
        />
        {state.errors?.phone?.[0] && <p className={errorClass}>{state.errors.phone[0]}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Adresse e-mail <span className="text-red-500">*</span>
        </label>
        <input
          className={inputClass}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.be"
        />
        {state.errors?.email?.[0] && <p className={errorClass}>{state.errors.email[0]}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Mot de passe <span className="text-red-500">*</span>
        </label>
        <input
          className={inputClass}
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          placeholder="8 caractères minimum"
        />
        {state.errors?.password?.[0] && <p className={errorClass}>{state.errors.password[0]}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Confirmer le mot de passe <span className="text-red-500">*</span>
        </label>
        <input
          className={inputClass}
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
        />
        {state.errors?.confirm?.[0] && <p className={errorClass}>{state.errors.confirm[0]}</p>}
      </div>

      {state.message && !state.ok && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-full bg-brand-yellow px-6 py-3.5 text-[15px] font-bold text-brand-charcoal shadow-[0_4px_16px_rgba(249,205,26,0.35)] transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark disabled:opacity-60"
      >
        {pending ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
