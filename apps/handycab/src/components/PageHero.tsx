import Link from "next/link";
import { site } from "../../content/site";
import { Icon } from "./Icon";
import { RevealHero } from "./Reveal";

function Cta({
  href,
  label,
  external,
  variant,
}: {
  href: string;
  label: string;
  external?: boolean;
  variant: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-brand-yellow px-6 py-3.5 text-[14px] font-bold text-brand-charcoal shadow-[0_4px_14px_rgba(249,205,26,0.3)] transition-all hover:-translate-y-0.5 hover:bg-brand-yellow-dark"
      : "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-brand-border bg-white px-6 py-3.5 text-[14px] font-medium text-brand-dark shadow-sm transition-all hover:-translate-y-0.5";

  if (external || href.startsWith("tel:") || href.startsWith("mailto:")) {
    const blank =
      external &&
      !href.startsWith("tel:") &&
      !href.startsWith("mailto:");
    return (
      <a
        href={href}
        {...(blank ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={className}
      >
        {label}
        {variant === "primary" ? <Icon name="arrow" /> : null}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
      {variant === "primary" ? <Icon name="arrow" /> : null}
    </Link>
  );
}

export function PageHero({
  eyebrow,
  title,
  body,
  primaryHref = site.bookingUrl,
  primaryLabel = "Réserver maintenant",
  primaryExternal = true,
  secondaryHref,
  secondaryLabel,
  secondaryExternal = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  primaryExternal?: boolean;
  secondaryHref?: string;
  secondaryLabel?: string;
  secondaryExternal?: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-white pb-12 pt-40 md:pb-16 md:pt-44">
      <div className="pointer-events-none absolute inset-0 dot-pattern" />
      <div className="pointer-events-none absolute -top-16 left-1/2 h-[420px] w-[780px] -translate-x-1/2 blur-[120px] hero-glow" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <RevealHero>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-yellow" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800">
              {eyebrow}
            </span>
          </div>
        </RevealHero>
        <RevealHero delay={0.08}>
          <h1 className="font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.03em] text-brand-dark sm:text-[52px]">
            {title}
          </h1>
        </RevealHero>
        <RevealHero delay={0.16}>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-slate-600 sm:text-[18px]">
            {body}
          </p>
        </RevealHero>
        <RevealHero delay={0.24} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Cta
            href={primaryHref}
            label={primaryLabel}
            external={primaryExternal}
            variant="primary"
          />
          {secondaryHref && secondaryLabel ? (
            <Cta
              href={secondaryHref}
              label={secondaryLabel}
              external={secondaryExternal}
              variant="secondary"
            />
          ) : null}
        </RevealHero>
      </div>
    </section>
  );
}
