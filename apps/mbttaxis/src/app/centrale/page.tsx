import type { Metadata } from "next";
import Link from "next/link";
import { centrale } from "../../../content/centrale";
import { Reveal, RevealItem, RevealStagger } from "../../components/Reveal";

export const metadata: Metadata = {
  title: centrale.meta.title,
  description: centrale.meta.description,
};

export default function CentralePage() {
  return (
    <>
      <section className="bg-soft pt-36 pb-16">
        <div className="container-mbt grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <Reveal direction="left">
            <p className="text-sm font-semibold tracking-[0.12em] text-brand uppercase">
              {centrale.hero.eyebrow}
            </p>
            <h1 className="mt-3 text-ink">{centrale.hero.title}</h1>
            <p className="mt-4 max-w-2xl text-body">{centrale.hero.text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={centrale.hero.primaryHref} className="btn btn-primary">
                {centrale.hero.primaryCta}
              </a>
              <Link href={centrale.hero.secondaryHref} className="btn btn-secondary">
                {centrale.hero.secondaryCta}
              </Link>
            </div>
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <div className="flex justify-center lg:justify-end">
              <div className="flex h-44 w-44 flex-col items-center justify-center rounded-[2rem] bg-brand text-white shadow-sm sm:h-52 sm:w-52">
                <i className="fa fa-phone text-4xl" aria-hidden />
                <p className="mt-3 text-center text-sm font-bold leading-snug px-4">
                  Centrale humaine
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt max-w-4xl">
          <Reveal direction="up">
            <h2 className="text-brand">{centrale.presentation.title}</h2>
            <p className="mt-4 text-body">{centrale.presentation.text}</p>
            <p className="mt-3 text-body">{centrale.presentation.note}</p>
            <ul className="mt-6 space-y-3">
              {centrale.presentation.points.map((point) => (
                <li key={point} className="flex gap-3 text-body">
                  <i className="fa fa-check mt-1 text-brand" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <a href={centrale.presentation.href} className="btn btn-primary mt-8">
              {centrale.presentation.cta}
            </a>
          </Reveal>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-ink">{centrale.role.title}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-body">
              {centrale.role.intro}
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-6 md:grid-cols-3">
            {centrale.role.items.map((item) => (
              <RevealItem key={item.title} direction="up">
                <article className="h-full rounded-2xl border border-border bg-white p-6">
                  <h3 className="text-xl text-ink">{item.title}</h3>
                  <p className="mt-3 text-body">{item.text}</p>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt grid gap-10 lg:grid-cols-2">
          <Reveal direction="left">
            <h2 className="text-brand">{centrale.details.title}</h2>
            <ul className="mt-6 space-y-4 text-body">
              <li>
                <i className="fa fa-phone mr-2 text-brand" aria-hidden />
                <a href={centrale.details.phoneHref} className="font-medium text-ink">
                  {centrale.details.phone}
                </a>
              </li>
              <li>
                <i className="fa fa-clock-o mr-2 text-brand" aria-hidden />
                <strong>{centrale.details.hoursLabel} :</strong> {centrale.details.hours}
              </li>
              <li>
                <i className="fa fa-envelope-o mr-2 text-brand" aria-hidden />
                <a href={`mailto:${centrale.details.email}`}>{centrale.details.email}</a>
              </li>
              <li>
                <i className="fa fa-map-marker mr-2 text-brand" aria-hidden />
                {centrale.details.addressLine}
              </li>
            </ul>
            <a href={centrale.details.phoneHref} className="btn btn-primary mt-8">
              {centrale.details.cta}
            </a>
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <h2 className="text-brand">{centrale.prepare.title}</h2>
            <p className="mt-3 text-body">{centrale.prepare.intro}</p>
            <ul className="mt-6 list-disc space-y-2 pl-6 text-body">
              {centrale.prepare.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link href={centrale.prepare.href} className="btn btn-secondary mt-8">
              {centrale.prepare.cta}
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="container-mbt max-w-3xl">
          <Reveal direction="up">
            <h2 className="text-center text-ink">{centrale.faq.title}</h2>
          </Reveal>
          <div className="mt-10 space-y-4">
            {centrale.faq.items.map((item) => (
              <Reveal key={item.q} direction="up">
                <details className="rounded-2xl border border-border bg-white p-5 open:shadow-sm">
                  <summary className="cursor-pointer list-none font-[family-name:var(--font-poppins)] text-lg font-bold text-ink">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-body">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand py-16 text-white">
        <div className="container-mbt max-w-3xl text-center">
          <Reveal direction="up">
            <h2 className="heading-on-brand">{centrale.finalCta.title}</h2>
            <p className="mt-4 text-white/90">{centrale.finalCta.text}</p>
            <a href={centrale.finalCta.href} className="btn btn-outline-light mt-8">
              {centrale.finalCta.cta}
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
