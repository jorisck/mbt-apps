"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword, type AuthState } from "../../actions/auth";

const initial: AuthState = { ok: false };

const inputClass =
  "h-12 w-full rounded-xl border border-brand-border bg-brand-surface px-3.5 text-[14px] text-brand-dark transition-all placeholder:text-slate-400 focus:border-brand-dark focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,205,26,0.25)]";

const errorClass = "mt-1 text-[12px] text-red-600";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, initial);

  if (state.ok) {
    return (
      <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <i className="fa fa-check text-2xl text-emerald-600" aria-hidden />
        </div>
        <p className="text-[15px] text-slate-700">{state.message}</p>
        <Link
          href="/compte/connexion"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[14px] font-bold text-brand-charcoal hover:bg-brand-yellow-dark transition-colors"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Nouveau mot de passe <span className="text-red-500">*</span>
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
          Confirmer <span className="text-red-500">*</span>
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
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
