import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { home } from "../../content/home";
import { HandycabCard } from "../components/HandycabCard";
import { HeroVideo } from "../components/HeroVideo";
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
      <section className="hero-curve relative min-h-[85vh] overflow-hidden bg-muted pt-36 pb-40">
        <HeroVideo youtubeId={home.hero.youtubeId} />
        <div className="container-mbt relative z-10">
          <Reveal direction="left">
            <h1 className="display-1">{home.hero.title}</h1>
          </Reveal>
          <Reveal direction="left" delay={0.12}>
            <p className="hero-subtitle mt-2">{home.hero.subtitle}</p>
          </Reveal>
          <Reveal direction="left" delay={0.22}>
            <p className="hero-lead mt-4 max-w-xl">{home.hero.text}</p>
          </Reveal>
          <Reveal direction="right" delay={0.35}>
            <Link href={home.hero.ctaHref} className="btn btn-hero mt-8">
              {home.hero.cta}
            </Link>
          </Reveal>
        </div>
      </section>

      <section id={home.services.id} className="bg-white py-24">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-brand">{home.services.title}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-body">
              {home.services.intro}
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-8 md:grid-cols-3" delay={0.1}>
            {home.services.cards.map((card, i) => (
              <RevealItem
                key={card.href}
                direction={i === 0 ? "left" : i === 2 ? "right" : "up"}
              >
                <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-6">
                    <h5 className="font-[family-name:var(--font-poppins)] text-xl font-bold text-ink">
                      {card.title}
                    </h5>
                    <p className="mt-1 font-bold text-body">{card.eyebrow}</p>
                    <p className="mt-3 text-body">{card.text}</p>
                    <Link href={card.href} className="btn btn-primary mt-5">
                      {card.cta}
                    </Link>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="bg-brand py-20 text-white">
        <div className="container-mbt grid items-center gap-10 lg:grid-cols-2">
          <Reveal direction="left">
            <h2 className="heading-on-brand">{home.audience.title}</h2>
            {home.audience.paragraphs.map((p) => (
              <p key={p.slice(0, 32)} className="mt-4 text-white/90">
                {p}
              </p>
            ))}
          </Reveal>
          <Reveal direction="right" delay={0.15}>
            <SplitImage
              src="/images/audience-pmr.jpg"
              alt="Accompagnement PMR — véhicule adapté"
              stagger="right-down"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-mbt grid items-center gap-10 lg:grid-cols-2">
          <Reveal direction="left">
            <SplitImage
              src="/images/engagements-pmr.jpg"
              alt="Nos engagements — flotte et accompagnement MBT"
              stagger="right-down"
            />
          </Reveal>
          <Reveal direction="right" delay={0.12}>
            <h2 className="text-ink">{home.commitments.title}</h2>
            {home.commitments.paragraphs.map((p) => (
              <p key={p.slice(0, 32)} className="mt-4 text-body">
                {p}
              </p>
            ))}
            <Link href={home.commitments.ctaHref} className="btn btn-secondary mt-6">
              {home.commitments.cta}
            </Link>
          </Reveal>
        </div>
      </section>

      <Reveal direction="up">
        <TestimonialsCarousel />
      </Reveal>

      <Reveal direction="up">
        <HandycabCard />
      </Reveal>
    </>
  );
}
