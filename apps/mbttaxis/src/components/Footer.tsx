import Link from "next/link";
import { footer } from "../../content/footer";
import { Reveal } from "./Reveal";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white pt-16 pb-8">
      <Reveal direction="up" className="container-mbt grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="mb-4 text-brand">{footer.usefulLinks.title}</h3>
          <ul className="space-y-2">
            {footer.usefulLinks.links.map((link) => (
              <li key={link.href + link.label}>
                <Link href={link.href} className="text-brand hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-brand">Informations légales</h3>
          <p className="text-sm text-body">{footer.agreement}</p>
          <p className="mt-3 font-medium text-body">{footer.slogan}</p>
        </div>

        <div>
          <h3 className="mb-4 text-brand">{footer.assistance.title}</h3>
          <ul className="space-y-3 text-body">
            <li>
              <Link href={footer.assistance.contactHref} className="hover:text-brand">
                <i className="fa fa-commenting-o mr-2" aria-hidden />
                {footer.assistance.contactLabel}
              </Link>
            </li>
            <li>
              <a href={`mailto:${footer.assistance.email}`} className="hover:text-brand">
                <i className="fa fa-envelope-o mr-2" aria-hidden />
                {footer.assistance.email}
              </a>
            </li>
            <li>
              <a href={footer.assistance.phoneHref} className="hover:text-brand">
                <i className="fa fa-phone mr-2" aria-hidden />
                {footer.assistance.phone}
              </a>
            </li>
          </ul>
          <div className="mt-4 flex gap-2">
            <a
              href={footer.social.facebook}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-ink"
              aria-label="Facebook"
              rel="noopener noreferrer"
              target="_blank"
            >
              <i className="fa fa-facebook" aria-hidden />
            </a>
            <a
              href={footer.social.linkedin}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-ink"
              aria-label="LinkedIn"
              rel="noopener noreferrer"
              target="_blank"
            >
              <i className="fa fa-linkedin" aria-hidden />
            </a>
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-ink"
              aria-label="Accueil"
            >
              <i className="fa fa-home" aria-hidden />
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal
        direction="fade"
        delay={0.1}
        className="container-mbt mt-12 flex flex-col gap-2 border-t border-border pt-6 text-sm text-body sm:flex-row sm:items-center sm:justify-between"
      >
        <Link href="/cookie-policy" className="hover:text-brand">
          {footer.cookiePolicyLabel}
        </Link>
        <p>{footer.copyright}</p>
      </Reveal>
    </footer>
  );
}
