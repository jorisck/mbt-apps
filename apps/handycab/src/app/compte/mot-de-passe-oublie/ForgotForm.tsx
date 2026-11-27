"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword, type AuthState } from "../../actions/auth";

const initial: AuthState = { ok: false };

const inputClass =
  "h-12 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 text-[14px] text-brand-dark transition-all placeholder:text-slate-400 focus:border-brand-dark focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,205,26,0.25)]";

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPassword, initial);

  if (state.ok) {
    return (
      <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <i className="fa fa-envelope-o text-2xl text-emerald-600" aria-hidden />
        </div>
        <p className="text-[15px] text-slate-700">{state.message}</p>
        <Link
          href="/compte/connexion"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-dark px-6 py-3 text-[14px] font-semibold text-white hover:bg-black transition-colors"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

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
        {pending ? "Envoi…" : "Envoyer le lien"}
      </button>

      <div className="text-center">
        <Link href="/compte/connexion" className="text-[13px] text-brand-accent hover:underline">
          ← Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
