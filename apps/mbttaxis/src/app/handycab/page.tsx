import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { handycab } from "../../../content/handycab";
import { Reveal, RevealItem, RevealStagger } from "../../components/Reveal";

export const metadata: Metadata = {
  title: handycab.meta.title,
  description: handycab.meta.description,
};

export default function HandycabPage() {
  return (
    <>
      <section className="bg-soft pt-36 pb-16">
        <div className="container-mbt grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <Reveal direction="left">
            <p className="text-sm font-semibold tracking-[0.12em] text-brand uppercase">
              {handycab.hero.eyebrow}
            </p>
            <h1 className="mt-3 text-ink">{handycab.hero.title}</h1>
            <p className="mt-4 max-w-2xl text-body">{handycab.hero.text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={handycab.hero.primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                {handycab.hero.primaryCta}
              </Link>
              <a href={handycab.hero.secondaryHref} className="btn btn-secondary">
                {handycab.hero.secondaryCta}
              </a>
            </div>
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <div className="flex justify-center lg:justify-end">
              <Image
                src="/images/logos/logo-handycab.png"
                alt="Handycab"
                width={180}
                height={180}
                className="h-40 w-40 rounded-[2rem] object-contain shadow-sm sm:h-48 sm:w-48"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt max-w-4xl">
          <Reveal direction="up">
            <h2 className="text-brand">{handycab.presentation.title}</h2>
            <p className="mt-4 text-body">{handycab.presentation.text}</p>
            <p className="mt-3 text-body">{handycab.presentation.note}</p>
            <ul className="mt-6 space-y-3">
              {handycab.presentation.points.map((point) => (
                <li key={point} className="flex gap-3 text-body">
                  <i className="fa fa-check mt-1 text-brand" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Link
              href={handycab.presentation.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary mt-8"
            >
              {handycab.presentation.cta}
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-ink">{handycab.steps.title}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-body">
              {handycab.steps.intro}
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-6 md:grid-cols-3">
            {handycab.steps.items.map((item) => (
              <RevealItem key={item.step} direction="up">
                <article className="h-full rounded-2xl border border-border bg-white p-6 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-xl text-ink">{item.title}</h3>
                  <p className="mt-3 text-body">{item.text}</p>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-brand">{handycab.audience.title}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-body">
              {handycab.audience.text}
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-6 md:grid-cols-3">
            {handycab.audience.items.map((item) => (
              <RevealItem key={item.title} direction="up">
                <article className="h-full rounded-2xl border border-border p-6">
                  <h3 className="text-xl text-ink">{item.title}</h3>
                  <p className="mt-3 text-body">{item.text}</p>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-ink">{handycab.apps.title}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-body">
              {handycab.apps.intro}
            </p>
          </Reveal>
          <RevealStagger className="mt-10 grid gap-6 md:grid-cols-2">
            {[handycab.apps.android, handycab.apps.ios].map((app) => (
              <RevealItem key={app.title} direction="up">
                <article className="h-full rounded-2xl border border-border bg-white p-8">
                  <h3 className="text-xl text-ink">{app.title}</h3>
                  <p className="mt-3 text-body">{app.text}</p>
                  <Link
                    href={app.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary mt-6"
                  >
                    {app.cta}
                  </Link>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt grid gap-10 lg:grid-cols-2">
          <Reveal direction="left">
            <h2 className="text-brand">{handycab.help.title}</h2>
            <p className="mt-4 text-body">{handycab.help.text}</p>
            <a href={handycab.help.phoneHref} className="btn btn-primary mt-8">
              {handycab.help.phoneCta}
            </a>
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <div className="rounded-2xl border border-border bg-soft p-8">
              <p className="text-body">{handycab.help.alt}</p>
              <Link href={handycab.help.altHref} className="btn btn-secondary mt-6">
                {handycab.help.altCta}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="container-mbt max-w-3xl">
          <Reveal direction="up">
            <h2 className="text-center text-ink">{handycab.faq.title}</h2>
          </Reveal>
          <div className="mt-10 space-y-4">
            {handycab.faq.items.map((item) => (
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
            <h2 className="heading-on-brand">{handycab.innovation.title}</h2>
            {handycab.innovation.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-white/90">
                {p}
              </p>
            ))}
            <p className="mt-8 text-lg font-medium">{handycab.innovation.help}</p>
            <a
              href={handycab.innovation.helpHref}
              className="btn btn-outline-light mt-6"
            >
              Appeler Handycab
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
