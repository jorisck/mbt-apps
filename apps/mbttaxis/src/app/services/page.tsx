import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { services } from "../../../content/services";
import { Reveal, RevealItem, RevealStagger } from "../../components/Reveal";

export const metadata: Metadata = {
  title: services.meta.title,
  description: services.meta.description,
};

export default function ServicesPage() {
  return (
    <>
      <section className="bg-soft pt-36 pb-16">
        <div className="container-mbt max-w-4xl">
          <Reveal direction="up">
            <p className="text-sm font-semibold tracking-[0.12em] text-brand uppercase">
              {services.hero.eyebrow}
            </p>
            <h1 className="mt-3 text-ink">{services.hero.title}</h1>
            <p className="mt-4 text-body">{services.hero.text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={services.hero.primaryHref} className="btn btn-primary">
                {services.hero.primaryCta}
              </Link>
              <a href={services.hero.secondaryHref} className="btn btn-secondary">
                {services.hero.secondaryCta}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="liste-services" className="scroll-mt-28 bg-white py-16">
        <div className="container-mbt">
          <RevealStagger className="grid gap-8 md:grid-cols-2">
            {services.items.map((item) => (
              <RevealItem key={item.id} direction="up">
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={item.image}
                      alt={item.eyebrow}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-8">
                    <p className="text-sm font-bold text-brand">{item.eyebrow}</p>
                    <h2 className="mt-2 text-2xl text-ink">{item.title}</h2>
                    <p className="mt-4 flex-1 text-body">{item.text}</p>
                    <Link href={item.href} className="btn btn-primary mt-6 w-fit">
                      {item.cta}
                    </Link>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-brand">{services.guide.title}</h2>
          </Reveal>
          <RevealStagger className="mt-10 overflow-hidden rounded-2xl border border-border bg-white">
            <div className="hidden grid-cols-[1.2fr_1fr_auto] gap-4 border-b border-border bg-muted px-6 py-3 text-sm font-semibold text-ink md:grid">
              <span>Votre besoin</span>
              <span>Service conseillé</span>
              <span>Action</span>
            </div>
            {services.guide.rows.map((row) => (
              <RevealItem key={row.need} direction="up">
                <div className="grid gap-3 border-b border-border px-6 py-5 last:border-b-0 md:grid-cols-[1.2fr_1fr_auto] md:items-center md:gap-4">
                  <p className="font-medium text-ink">{row.need}</p>
                  <p className="text-body">{row.service}</p>
                  <Link href={row.href} className="btn btn-primary w-fit text-sm">
                    {row.cta}
                  </Link>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="bg-brand py-16 text-white">
        <div className="container-mbt text-center">
          <Reveal direction="up">
            <h2 className="heading-on-brand mx-auto max-w-3xl">
              {services.finalCta.title}
            </h2>
            <a href={services.finalCta.href} className="btn btn-outline-light mt-8">
              {services.finalCta.cta}
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
