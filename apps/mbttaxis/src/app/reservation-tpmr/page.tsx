import type { Metadata } from "next";
import Link from "next/link";
import { reservation } from "../../../content/reservation";
import { ImagePlaceholder } from "../../components/ImagePlaceholder";
import { MapConsent } from "../../components/MapConsent";
import { Reveal, RevealItem, RevealStagger } from "../../components/Reveal";

const page = reservation.pmrPage;

export const metadata: Metadata = {
  title: page.meta.title,
  description: page.meta.description,
};

export default function ReservationPmrPage() {
  return (
    <>
      <section className="hero-curve relative flex min-h-[75vh] items-center overflow-hidden bg-ink pt-28 pb-20 text-center">
        <div className="absolute inset-0 img-placeholder opacity-40" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="container-mbt relative z-10 w-full">
          <Reveal direction="up">
            <h1 className="hero-page-title">{page.hero.title}</h1>
          </Reveal>
          <Reveal direction="up" delay={0.1}>
            <p className="hero-subtitle mt-4">{page.hero.subtitle}</p>
          </Reveal>
          <Reveal direction="up" delay={0.2}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={page.hero.primaryHref} className="btn btn-primary">
                {page.hero.primaryCta}
              </Link>
              <Link
                href={page.hero.secondaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-light"
              >
                {page.hero.secondaryCta}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-brand">{page.features.title}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-body">
              {page.features.intro}
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-6 md:grid-cols-2">
            {page.features.items.map((item, i) => (
              <RevealItem key={item.title} direction={i % 2 === 0 ? "left" : "right"}>
                <article className="flex gap-4 rounded-2xl border border-border p-4">
                  <ImagePlaceholder
                    label={item.title}
                    className="h-24 w-24 shrink-0 rounded-xl"
                    ratio="aspect-square"
                  />
                  <div>
                    <h3 className="text-xl text-ink">{item.title}</h3>
                    <p className="mt-2 text-body">{item.text}</p>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="container-mbt grid gap-10 lg:grid-cols-2">
          <Reveal direction="left">
            <MapConsent />
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <h2 className="text-brand">{page.zones.title}</h2>
            <p className="mt-4 text-body">{page.zones.text}</p>
            <Link href="/reservation?service=pmr" className="btn btn-primary mt-8">
              Réserver un taxi PMR
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-white pb-20 pt-10">
        <div className="container-mbt grid items-center gap-10 lg:grid-cols-2">
          <Reveal direction="left">
            <h2 className="text-brand">{reservation.urgent.title}</h2>
            <p className="mt-4 text-body">{reservation.urgent.text}</p>
            <a href={reservation.urgent.phoneHref} className="btn btn-secondary mt-6">
              {reservation.urgent.cta}
            </a>
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <ImagePlaceholder label="Taxi PMR" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
