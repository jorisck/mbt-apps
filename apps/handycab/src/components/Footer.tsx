import Image from "next/image";
import Link from "next/link";
import { site } from "../../content/site";
import { Icon } from "./Icon";

export function Footer() {
  return (
    <footer className="w-full border-t border-brand-border bg-brand-surface">
      <div className="mx-auto max-w-7xl px-6 pb-12 pt-16">
        <div className="grid grid-cols-1 gap-10 border-b border-brand-border pb-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Link href="/" className="inline-flex w-fit items-center gap-3">
              <Image
                src="/logo.png"
                alt="HandyCab"
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl object-contain"
              />
              <span className="font-display text-[20px] font-bold text-brand-dark">
                HandyCab
              </span>
            </Link>
            <p className="max-w-sm text-[14px] leading-relaxed text-slate-600">
              Division spécialisée de{" "}
              <strong className="text-brand-dark">MBT Taxis SRL</strong>.
              Transport conventionné de personnes à mobilité réduite en Région
              de Bruxelles-Capitale. Agréé auprès des mutuelles et du SPF
              Mobilité.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">
                <Icon name="verified" className="text-[13px] text-brand-accent" />
                Agrément TX-PMR Région Bruxelles
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark">
              Services PMR
            </span>
            <ul className="space-y-2 text-[13px] text-slate-600">
              <li>
                <a className="hover:text-brand-dark" href="#flotte">
                  Vans 100 % électriques
                </a>
              </li>
              <li>
                <a className="hover:text-brand-dark" href="#calculateur">
                  Transport fauteuil manuel
                </a>
              </li>
              <li>
                <a className="hover:text-brand-dark" href="#calculateur">
                  Fauteuil électrique lourd
                </a>
              </li>
              <li>
                <a className="hover:text-brand-dark" href="#contact">
                  Séries de soins & dialyse
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark">
              Institution & réseau
            </span>
            <ul className="space-y-2 text-[13px] text-slate-600">
              <li>
                <a
                  className="font-semibold text-brand-accent hover:text-brand-accent"
                  href={site.parent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Portail MBT Taxis ↗
                </a>
              </li>
              <li>
                <a className="hover:text-brand-dark" href="#contact">
                  Agréments mutuelles
                </a>
              </li>
              <li>
                <a className="hover:text-brand-dark" href="#contact">
                  Conventions hôpitaux
                </a>
              </li>
              <li>
                <a className="hover:text-brand-dark" href="#chauffeurs">
                  Charte d’accompagnement
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark">
              Permanence 24/7
            </span>
            <div className="flex flex-col gap-1 rounded-xl border border-brand-border bg-white p-4">
              <span className="text-[11px] font-medium text-slate-500">
                Ligne directe dispatch :
              </span>
              <a
                className="text-[16px] font-bold text-brand-dark transition-colors hover:text-brand-accent"
                href={site.phoneHref}
              >
                {site.phone}
              </a>
              <span className="pt-1 text-[11px] text-slate-500">
                {site.address.street}, {site.address.postalCode}{" "}
                {site.address.city}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-[12px] text-slate-500 sm:flex-row">
          <div>
            © 2026 HandyCab Bruxelles. Une marque exploitée par MBT Taxis SRL.
            Tous droits réservés.
          </div>
          <div className="flex items-center gap-4">
            <Link className="hover:text-brand-dark" href="/mentions-legales">
              Mentions légales
            </Link>
            <span>•</span>
            <Link className="hover:text-brand-dark" href="/cookie-policy">
              Protection des données (RGPD)
            </Link>
            <span>•</span>
            <a className="hover:text-brand-dark" href="#application">
              Charte d’accessibilité
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
