import Image from "next/image";
import Link from "next/link";
import { footer, site } from "../../content/site";
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
                alt="Handycab"
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl object-contain"
              />
              <span className="font-display text-[20px] font-bold text-brand-dark">
                {footer.brand.title}
              </span>
            </Link>
            <p className="max-w-sm text-[14px] leading-relaxed text-slate-600">
              <strong className="text-brand-dark">{site.tagline}</strong>
              <br />
              {footer.brand.body}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href={site.parent.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-brand-accent hover:text-brand-dark"
              >
                {site.parent.label}{" "}
                <strong className="text-brand-accent">{site.parent.name}</strong>
                <span className="text-brand-accent">↗</span>
              </a>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">
                <Icon name="verified" className="text-[13px] text-brand-accent" />
                Taxis autorisés Région Bruxelles-Capitale
              </span>
            </div>
          </div>

          {footer.columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark">
                {col.title}
              </span>
              <ul className="space-y-2 text-[13px] text-slate-600">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        className="hover:text-brand-dark"
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link className="hover:text-brand-dark" href={link.href}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col justify-between gap-6 rounded-2xl border border-brand-border bg-white p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
              Coordonnées
            </p>
            <a
              href={site.phoneHref}
              className="mt-1 block text-[18px] font-bold text-brand-dark hover:text-brand-accent"
            >
              {site.phoneDisplay}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="text-[13px] text-slate-600 hover:text-brand-dark"
            >
              {site.email}
            </a>
            <p className="mt-1 text-[13px] text-slate-500">
              {site.address.street}, {site.address.postalCode}{" "}
              {site.address.city}
            </p>
          </div>
          <a
            href={site.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-yellow px-6 py-3 text-[13px] font-bold text-brand-charcoal transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark"
          >
            Réserver un taxi adapté
            <Icon name="arrow" />
          </a>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-[12px] text-slate-500 sm:flex-row">
          <div>
            © 2026 Handycab. Un service proposé par {site.parent.name}. Tous
            droits réservés.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link className="hover:text-brand-dark" href="/mentions-legales">
              Mentions légales
            </Link>
            <span>•</span>
            <Link className="hover:text-brand-dark" href="/cookie-policy">
              Cookies et confidentialité
            </Link>
            <span>•</span>
            <a
              className="hover:text-brand-dark"
              href={site.conditionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Conditions générales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
