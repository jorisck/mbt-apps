import type { Metadata } from "next";
import Link from "next/link";
import { reservation } from "../../../content/reservation";
import { ImagePlaceholder } from "../../components/ImagePlaceholder";
import { MapConsent } from "../../components/MapConsent";
import { Reveal, RevealItem, RevealStagger } from "../../components/Reveal";
import { ReservationForm } from "../../components/forms/ReservationForm";

export const metadata: Metadata = {
  title: reservation.meta.title,
  description: reservation.meta.description,
};

export default function ReservationPage() {
  return (
    <>
      <section className="hero-curve relative flex min-h-[75vh] items-center overflow-hidden bg-ink pt-28 pb-20 text-center">
        <div className="absolute inset-0 img-placeholder opacity-40" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="container-mbt relative z-10 w-full">
          <Reveal direction="up">
            <h1 className="hero-page-title">{reservation.hero.title}</h1>
          </Reveal>
          <Reveal direction="up" delay={0.1}>
            <p className="hero-subtitle mt-4">{reservation.hero.subtitle}</p>
          </Reveal>
          <Reveal direction="up" delay={0.2}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={reservation.hero.primaryHref} className="btn btn-primary">
                {reservation.hero.primaryCta}
              </Link>
              <Link href={reservation.hero.secondaryHref} className="btn btn-primary">
                {reservation.hero.secondaryCta}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-brand">{reservation.features.title}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-body">
              {reservation.features.intro}
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-6 md:grid-cols-2">
            {reservation.features.items.map((item, i) => (
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
            <h2 className="text-brand">{reservation.zones.title}</h2>
            <p className="mt-4 text-body">{reservation.zones.text}</p>
          </Reveal>
        </div>
      </section>

      <section id={reservation.form.id} className="bg-white py-20">
        <div className="container-mbt max-w-3xl">
          <Reveal direction="up">
            <h2 className="text-center text-brand">{reservation.form.title}</h2>
            <p className="mx-auto mt-3 mb-10 max-w-2xl text-center text-body">
              {reservation.form.intro}
            </p>
          </Reveal>
          <Reveal direction="up" delay={0.12}>
            <ReservationForm />
          </Reveal>
        </div>
      </section>

      <section className="bg-white pb-20">
        <div className="container-mbt grid items-center gap-10 lg:grid-cols-2">
          <Reveal direction="left">
            <h2 className="text-brand">{reservation.urgent.title}</h2>
            <p className="mt-4 text-body">{reservation.urgent.text}</p>
            <p className="mt-6">
              <i className="fa fa-phone mr-2 text-brand" aria-hidden />
              <strong>{reservation.urgent.phoneLabel}</strong>
              <br />
              <a href={`tel:${reservation.urgent.phone.replace(/\s/g, "")}`}>
                {reservation.urgent.phone}
              </a>
            </p>
            <p className="mt-4">
              <i className="fa fa-map-marker mr-2 text-brand" aria-hidden />
              <strong>{reservation.urgent.officeLabel}</strong>
              <br />
              {reservation.urgent.address}
            </p>
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <ImagePlaceholder label="Taxi PMR" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
