import type { Metadata } from "next";
import Link from "next/link";
import { adaptation } from "../../../content/adaptation";
import { ImagePlaceholder } from "../../components/ImagePlaceholder";
import { Reveal, RevealItem, RevealStagger } from "../../components/Reveal";
import { QuoteForm } from "../../components/forms/QuoteForm";

export const metadata: Metadata = {
  title: adaptation.meta.title,
  description: adaptation.meta.description,
};

const icons: Record<string, string> = {
  trophy: "fa-trophy",
  wrench: "fa-wrench",
  shield: "fa-shield",
};

export default function AdaptationPage() {
  return (
    <>
      <section className="bg-white pt-36 pb-16">
        <div className="container-mbt grid items-center gap-8 lg:grid-cols-2">
          <Reveal direction="left">
            <ImagePlaceholder
              label="Adaptation véhicule"
              className="rounded-[40%_60%_55%_45%/50%_40%_60%_50%]"
              ratio="aspect-[4/3]"
            />
          </Reveal>
          <Reveal direction="right" delay={0.12}>
            <div className="rounded-3xl bg-brand p-8 lg:-ml-10">
              <h1 className="heading-on-brand">{adaptation.hero.title}</h1>
              {adaptation.hero.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="mt-4 text-white/90">
                  {p}
                </p>
              ))}
              <Link href={adaptation.hero.ctaHref} className="btn btn-outline-light mt-6">
                {adaptation.hero.cta}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-ink">{adaptation.expertise.title}</h2>
          </Reveal>
          <RevealStagger className="mt-10 grid gap-6 md:grid-cols-2">
            {adaptation.expertise.cards.map((card, i) => (
              <RevealItem key={card.title} direction={i === 0 ? "left" : "right"}>
                <article className="relative min-h-[22rem] overflow-hidden rounded-2xl">
                  <div className="img-placeholder absolute inset-0" aria-hidden />
                  <div className="on-dark absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/45 to-black/15 p-6">
                    <h3 className="text-on-dark text-xl md:text-2xl">{card.title}</h3>
                    <p className="mt-2 line-clamp-5 text-sm text-white/90">{card.text}</p>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section id={adaptation.form.id} className="relative min-h-[70vh] py-20">
        <div className="absolute inset-0">
          <div className="img-placeholder h-full w-full" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="container-mbt relative z-10 grid gap-8 lg:grid-cols-2">
          <Reveal direction="left" className="on-dark">
            <h2 className="text-on-dark">{adaptation.form.title}</h2>
            <p className="mt-4 text-white/90">{adaptation.form.intro}</p>
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <QuoteForm />
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-brand">{adaptation.commitments.title}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-body">
              {adaptation.commitments.intro}
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-8 md:grid-cols-3 md:divide-x md:divide-border">
            {adaptation.commitments.items.map((item) => (
              <RevealItem key={item.title} direction="up">
                <div className="px-4 text-center">
                  <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-ink">
                    <i className={`fa ${icons[item.icon] ?? "fa-check"}`} aria-hidden />
                  </span>
                  <h3 className="text-xl text-ink">{item.title}</h3>
                  <p className="mt-3 text-body">{item.text}</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>
    </>
  );
}
