import type { Metadata } from "next";
import Link from "next/link";
import { tarifs } from "../../../content/tarifs";
import { ImagePlaceholder } from "../../components/ImagePlaceholder";
import { Reveal } from "../../components/Reveal";

export const metadata: Metadata = {
  title: tarifs.meta.title,
  description: tarifs.meta.description,
};

export default function TarifsPage() {
  return (
    <>
      <section className="bg-white pt-36 pb-16">
        <div className="container-mbt grid items-center gap-10 lg:grid-cols-2">
          <Reveal direction="left">
            <h1 className="text-ink">{tarifs.hero.title}</h1>
            {tarifs.hero.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-body">
                {p}
              </p>
            ))}
            <h2 className="mt-8 text-xl text-brand">{tarifs.destinations.title}</h2>
            <ul className="mt-3 list-disc space-y-1 pl-6 text-body">
              {tarifs.destinations.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link href={tarifs.hero.ctaHref} className="btn btn-secondary mt-6">
              {tarifs.hero.cta}
            </Link>
          </Reveal>
          <Reveal direction="right" delay={0.15}>
            <div className="relative">
              <div className="absolute -right-4 -bottom-4 h-full w-full rounded-[40%_60%_55%_45%/45%_40%_60%_55%] bg-muted" />
              <ImagePlaceholder
                label="VSL"
                className="relative rounded-[40%_60%_55%_45%/45%_40%_60%_55%]"
                ratio="aspect-square"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section id={tarifs.grid.id} className="bg-white pb-24">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-brand">{tarifs.grid.title}</h2>
            {tarifs.grid.intro.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 max-w-3xl text-body">
                {p}
              </p>
            ))}
          </Reveal>

          <Reveal direction="up" delay={0.12} className="mt-10">
            <article className="overflow-hidden rounded-2xl border border-border shadow-sm lg:grid lg:grid-cols-2">
              <div className="p-8">
                <h3 className="text-brand">{tarifs.grid.vehicle.name}</h3>
                <p className="mt-4 font-[family-name:var(--font-poppins)] text-4xl font-bold text-brand">
                  {tarifs.grid.vehicle.price}
                  <span className="ml-2 text-base font-normal text-body">
                    {tarifs.grid.vehicle.priceNote}
                  </span>
                </p>
                <p className="mt-4 text-body">{tarifs.grid.vehicle.description}</p>
                <Link href={tarifs.grid.vehicle.ctaHref} className="btn btn-primary mt-6">
                  {tarifs.grid.vehicle.cta}
                </Link>
              </div>
              <div className="border-t border-border bg-soft p-8 lg:border-t-0 lg:border-l">
                <ul className="divide-y divide-border">
                  {tarifs.grid.lines.map((line) => (
                    <li
                      key={line.label}
                      className="flex items-start justify-between gap-4 py-4"
                    >
                      <span className="text-body">
                        <i className="fa fa-road mr-2 text-brand" aria-hidden />
                        {line.label}
                      </span>
                      <strong className="shrink-0 text-brand">{line.value}</strong>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-bold text-body">{tarifs.grid.vatNote}</p>
                <p className="mt-6 rounded-xl bg-muted px-4 py-3 text-body">
                  {tarifs.grid.footerNote}
                </p>
              </div>
            </article>
          </Reveal>
        </div>
      </section>
    </>
  );
}
