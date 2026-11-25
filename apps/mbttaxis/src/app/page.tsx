import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { home } from "../../content/home";
import { HandycabCard } from "../components/HandycabCard";
import { HeroVideo } from "../components/HeroVideo";
import { HeroVideoFile } from "../components/HeroVideoFile";
import { Reveal, RevealItem, RevealStagger } from "../components/Reveal";
import { SplitImage } from "../components/SplitImage";
import { TestimonialsCarousel } from "../components/TestimonialsCarousel";

export const metadata: Metadata = {
  title: home.meta.title,
  description: home.meta.description,
};

export default function HomePage() {
  return (
    <>
      <div className="bg-ink text-center text-sm text-white/90">
        <div className="container-mbt flex flex-col items-center justify-center gap-2 py-2 sm:flex-row sm:gap-4">
          <span>{home.topBar.text}</span>
          <a
            href={home.topBar.ctaHref}
            className="font-medium text-white underline-offset-2 hover:underline"
          >
            {home.topBar.cta}
          </a>
        </div>
      </div>

      <section className="hero-curve relative min-h-[85vh] overflow-hidden bg-muted pt-36 pb-40">
        {home.hero.video ? (
          <HeroVideoFile {...home.hero.video} />
        ) : (
          <HeroVideo youtubeId={home.hero.youtubeId} />
        )}
        <div className="container-mbt relative z-10">
          <Reveal direction="left">
            <p className="text-sm font-bold tracking-[0.12em] text-white uppercase drop-shadow-sm">
              {home.hero.eyebrow}
            </p>
          </Reveal>
          <Reveal direction="left" delay={0.08}>
            <h1 className="display-1 mt-3 max-w-4xl">{home.hero.title}</h1>
          </Reveal>
          <Reveal direction="left" delay={0.18}>
            <p className="hero-lead mt-4 max-w-2xl">{home.hero.text}</p>
          </Reveal>
          <Reveal direction="right" delay={0.3}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={home.hero.primaryHref} className="btn btn-hero">
                {home.hero.primaryCta}
              </Link>
              <Link
                href={home.hero.secondaryHref}
                className="btn btn-outline-light"
              >
                {home.hero.secondaryCta}
              </Link>
            </div>
          </Reveal>
          <Reveal direction="up" delay={0.4}>
            <ul className="mt-10 flex flex-wrap gap-2">
              {home.hero.badges.map((badge) => (
                <li
                  key={badge}
                  className="rounded-full border border-white/40 bg-black/40 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm"
                >
                  {badge}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 md:py-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent"
          aria-hidden
        />
        <div className="container-mbt">
          <RevealStagger className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {home.stats.map((stat, i) => (
              <RevealItem key={stat.value} direction="up">
                <article
                  className={`flex h-full flex-col px-2 lg:px-8 ${
                    i > 0 ? "lg:border-l lg:border-border" : ""
                  }`}
                >
                  <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-poppins)] text-5xl font-bold leading-none tracking-tight text-ink md:text-6xl">
                    {stat.value}
                  </p>
                  <p className="mt-4 text-sm font-bold text-body">{stat.text}</p>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent"
          aria-hidden
        />
      </section>

      <section id={home.services.id} className="bg-white py-24">
        <div className="container-mbt">
          <Reveal direction="up">
            <p className="text-center text-sm font-semibold tracking-[0.12em] text-brand uppercase">
              {home.services.eyebrow}
            </p>
            <h2 className="mt-3 text-center text-brand">{home.services.title}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-body">
              {home.services.intro}
            </p>
          </Reveal>
          <RevealStagger
            className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3"
            delay={0.1}
          >
            {home.services.cards.map((card, i) => (
              <RevealItem
                key={card.href + card.eyebrow}
                direction={i % 3 === 0 ? "left" : i % 3 === 2 ? "right" : "up"}
              >
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={card.image}
                      alt={card.eyebrow}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-sm font-bold text-brand">{card.eyebrow}</p>
                    <h5 className="mt-1 font-[family-name:var(--font-poppins)] text-xl font-bold text-ink">
                      {card.title}
                    </h5>
                    <p className="mt-3 flex-1 text-body">{card.text}</p>
                    <Link href={card.href} className="btn btn-primary mt-5 self-start">
                      {card.cta}
                    </Link>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
          <Reveal direction="up" className="mt-12 text-center">
            <Link href={home.services.footerHref} className="btn btn-secondary">
              {home.services.footerCta}
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-brand py-20 text-white">
        <div className="container-mbt grid items-center gap-10 lg:grid-cols-2">
          <Reveal direction="left">
            <p className="text-sm font-semibold tracking-[0.12em] text-white/70 uppercase">
              {home.why.eyebrow}
            </p>
            <h2 className="heading-on-brand mt-3">{home.why.title}</h2>
            <p className="mt-4 text-white/90">{home.why.text}</p>
            <ul className="mt-6 space-y-3">
              {home.why.points.map((point) => (
                <li key={point} className="flex gap-3 text-white/90">
                  <i className="fa fa-check mt-1 shrink-0" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={home.why.primaryHref} className="btn btn-outline-light">
                {home.why.primaryCta}
              </a>
              <Link href={home.why.secondaryHref} className="btn btn-outline-light">
                {home.why.secondaryCta}
              </Link>
            </div>
          </Reveal>
          <Reveal direction="right" delay={0.15}>
            <SplitImage
              src="/images/audience-pmr.jpg"
              alt="Accompagnement MBT — mobilité adaptée"
              stagger="right-down"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-ink">{home.steps.title}</h2>
          </Reveal>
          <RevealStagger className="mt-12 grid items-stretch gap-8 md:grid-cols-3">
            {home.steps.items.map((item) => (
              <RevealItem key={item.step} direction="up" className="h-full">
                <article className="flex h-full flex-col rounded-2xl border border-border p-6 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-xl text-ink">{item.title}</h3>
                  <p className="mt-3 flex-1 text-body">{item.text}</p>
                  <Link
                    href={home.steps.ctaHref}
                    className="btn btn-primary mt-6 self-center"
                  >
                    {home.steps.cta}
                  </Link>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <Reveal direction="up">
        <HandycabCard />
      </Reveal>

      <Reveal direction="up">
        <TestimonialsCarousel />
      </Reveal>

      <section className="bg-ink py-16 text-white">
        <div className="container-mbt text-center">
          <Reveal direction="up">
            <h2 className="heading-on-brand">{home.finalCta.title}</h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:items-start sm:gap-8">
              <div className="flex flex-col items-center gap-2">
                <a href={home.finalCta.primaryHref} className="btn btn-primary">
                  {home.finalCta.primaryCta}
                </a>
                <p className="text-sm text-white/60">{home.finalCta.primaryNote}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Link href={home.finalCta.secondaryHref} className="btn btn-outline-light">
                  {home.finalCta.secondaryCta}
                </Link>
                <p className="text-sm text-white/60">{home.finalCta.secondaryNote}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
