"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthState } from "../../actions/auth";

const initial: AuthState = { ok: false };

const inputClass =
  "h-12 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 text-[14px] text-brand-dark transition-all placeholder:text-slate-400 focus:border-brand-dark focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,205,26,0.25)]";

export function ConnexionForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Adresse e-mail
        </label>
        <input
          className={inputClass}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.be"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Mot de passe
        </label>
        <input
          className={inputClass}
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <div className="mt-1.5 text-right">
          <Link
            href="/compte/mot-de-passe-oublie"
            className="text-[12px] text-brand-accent hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
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
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
