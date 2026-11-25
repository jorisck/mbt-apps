import type { Metadata } from "next";
import { Suspense } from "react";
import { reservation } from "../../../content/reservation";
import { Reveal } from "../../components/Reveal";
import { ReservationForm } from "../../components/forms/ReservationForm";

export const metadata: Metadata = {
  title: reservation.meta.title,
  description: reservation.meta.description,
};

function ReservationFormFallback() {
  return (
    <div className="rounded-2xl border border-border bg-soft p-8 text-center text-body">
      Chargement du formulaire…
    </div>
  );
}

export default function ReservationPage() {
  return (
    <>
      <section className="bg-soft pt-36 pb-12">
        <div className="container-mbt max-w-3xl">
          <Reveal direction="up">
            <p className="text-sm font-semibold tracking-[0.12em] text-brand uppercase">
              {reservation.hero.eyebrow}
            </p>
            <h1 className="mt-3 text-ink">{reservation.hero.title}</h1>
            <p className="mt-4 text-body">{reservation.hero.text}</p>
          </Reveal>
        </div>
      </section>

      <section id={reservation.form.id} className="bg-white py-16">
        <div className="container-mbt max-w-3xl">
          <Reveal direction="up">
            <h2 className="text-center text-brand">{reservation.form.title}</h2>
            <p className="mx-auto mt-3 mb-10 max-w-2xl text-center text-body">
              {reservation.form.intro}
            </p>
          </Reveal>
          <Reveal direction="up" delay={0.1}>
            <Suspense fallback={<ReservationFormFallback />}>
              <ReservationForm />
            </Suspense>
          </Reveal>
        </div>
      </section>

      <section className="bg-soft py-16 pb-24">
        <div className="container-mbt max-w-3xl text-center">
          <Reveal direction="up">
            <h2 className="text-ink">{reservation.urgent.title}</h2>
            <p className="mt-4 text-body">{reservation.urgent.text}</p>
            <a href={reservation.urgent.phoneHref} className="btn btn-primary mt-8">
              {reservation.urgent.cta}
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
