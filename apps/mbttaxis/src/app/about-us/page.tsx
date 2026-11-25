import type { Metadata } from "next";
import Link from "next/link";
import { about } from "../../../content/about";
import { ImagePlaceholder } from "../../components/ImagePlaceholder";
import { Reveal, RevealItem, RevealStagger } from "../../components/Reveal";

export const metadata: Metadata = {
  title: about.meta.title,
  description: about.meta.description,
};

const tileToneClass = {
  muted: "bg-[#9aa0a6]",
  ink: "bg-ink",
  brand: "bg-brand",
} as const;

export default function AboutPage() {
  return (
    <>
      <section className="bg-soft pt-36 pb-16">
        <div className="container-mbt max-w-4xl">
          <Reveal direction="left">
            <p className="font-medium tracking-[0.08em] text-brand uppercase">
              {about.hero.eyebrow}
            </p>
            <h1 className="mt-2 max-w-3xl text-ink">{about.hero.title}</h1>
            <p className="mt-4 max-w-2xl text-body">{about.hero.text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={about.hero.primaryHref} className="btn btn-primary">
                {about.hero.primaryCta}
              </Link>
              <Link href={about.hero.secondaryHref} className="btn btn-secondary">
                {about.hero.secondaryCta}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt grid gap-10 lg:grid-cols-2">
          <Reveal direction="left">
            <h2 className="text-brand">{about.who.title}</h2>
            {about.who.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-body">
                {p}
              </p>
            ))}
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <ImagePlaceholder label="Équipe MBT" ratio="aspect-[4/3]" />
          </Reveal>
        </div>
      </section>

      <section className="bg-white pb-8">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-brand">{about.timeline.title}</h2>
          </Reveal>
          <div className="mt-10 space-y-6">
            {about.timeline.items.map((item, i) => (
              <Reveal key={item.year} direction={i % 2 === 0 ? "left" : "right"}>
                <article className="grid gap-4 rounded-2xl border border-border p-6 md:grid-cols-[8rem_1fr] md:items-start">
                  <p className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-brand">
                    {item.year}
                  </p>
                  <div>
                    <h3 className="text-xl text-ink">{item.title}</h3>
                    <p className="mt-2 text-body">{item.text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt">
          <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-2 lg:gap-6">
            <Reveal direction="left" className="h-full min-h-[22rem]">
              <ImagePlaceholder
                label="Mobilité PMR"
                ratio="h-full min-h-[22rem] aspect-auto"
                className="h-full rounded-2xl"
              />
            </Reveal>
            <RevealStagger
              className="grid h-full grid-cols-2 grid-rows-2 gap-4 lg:gap-6"
              stagger={0.08}
            >
              {about.highlightTiles.map((tile) => (
                <RevealItem key={tile.label} direction="right" className="h-full min-h-0">
                  <div
                    className={`flex h-full min-h-[9.5rem] items-end rounded-2xl p-5 sm:min-h-[11rem] sm:p-6 ${tileToneClass[tile.tone]}`}
                  >
                    <p className="font-[family-name:var(--font-poppins)] text-lg font-bold leading-snug text-white sm:text-xl">
                      {tile.label}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </div>
      </section>

      <section className="bg-brand py-16 text-white">
        <div className="container-mbt text-center">
          <Reveal direction="up">
            <h2 className="heading-on-brand mx-auto max-w-3xl">
              {about.finalCta.title}
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={about.finalCta.primaryHref} className="btn btn-outline-light">
                {about.finalCta.primaryCta}
              </Link>
              <Link href={about.finalCta.secondaryHref} className="btn btn-outline-light">
                {about.finalCta.secondaryCta}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
