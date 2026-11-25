import Link from "next/link";
import { footer } from "../../content/footer";
import { Reveal } from "./Reveal";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white pt-16 pb-8">
      <Reveal
        direction="up"
        className="container-mbt grid gap-10 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <h3 className="mb-4 text-brand">{footer.brand.title}</h3>
          <p className="font-medium text-ink">{footer.brand.tagline}</p>
          <p className="mt-3 text-sm text-body">{footer.brand.agreement}</p>
        </div>

        <div>
          <h3 className="mb-4 text-brand">{footer.services.title}</h3>
          <ul className="space-y-2">
            {footer.services.links.map((link) => (
              <li key={link.href + link.label}>
                <Link href={link.href} className="text-body hover:text-brand hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-brand">{footer.discover.title}</h3>
          <ul className="space-y-2">
            {footer.discover.links.map((link) => (
              <li key={link.href + link.label}>
                <Link href={link.href} className="text-body hover:text-brand hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-brand">{footer.contact.title}</h3>
          <ul className="space-y-3 text-body">
            <li>
              <a href={footer.contact.phoneHref} className="hover:text-brand">
                <i className="fa fa-phone mr-2" aria-hidden />
                {footer.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${footer.contact.email}`} className="hover:text-brand">
                <i className="fa fa-envelope-o mr-2" aria-hidden />
                {footer.contact.email}
              </a>
            </li>
            <li>
              <i className="fa fa-map-marker mr-2" aria-hidden />
              {footer.contact.address}
            </li>
            <li>
              <i className="fa fa-clock-o mr-2" aria-hidden />
              {footer.contact.hours}
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
          </div>
        </div>
      </Reveal>

      <Reveal
        direction="fade"
        delay={0.1}
        className="container-mbt mt-12 flex flex-col gap-2 border-t border-border pt-6 text-sm text-body sm:flex-row sm:items-center sm:justify-between"
      >
        <Link href={footer.legal.cookies.href} className="hover:text-brand">
          {footer.legal.cookies.label}
        </Link>
        <p>{footer.copyright}</p>
      </Reveal>
    </footer>
  );
}
