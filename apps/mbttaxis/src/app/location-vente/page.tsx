import type { Metadata } from "next";
import Link from "next/link";
import { location } from "../../../content/location";
import { Reveal } from "../../components/Reveal";
import { VehicleCarousel } from "../../components/VehicleCarousel";

export const metadata: Metadata = {
  title: location.meta.title,
  description: location.meta.description,
};

export default function LocationPage() {
  const { vehicle } = location.sale;

  return (
    <>
      <section className="relative overflow-hidden bg-white pt-36 pb-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-35deg, transparent, transparent 40px, rgba(21,96,189,0.08) 40px, rgba(21,96,189,0.08) 80px)",
          }}
        />
        <div className="container-mbt relative">
          <Reveal direction="left">
            <h1 className="text-ink">{location.intro.title}</h1>
            {location.intro.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 max-w-3xl text-body">
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="bg-white pb-12">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-brand">{location.sale.title}</h2>
            {location.sale.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 max-w-3xl text-body">
                {p}
              </p>
            ))}
          </Reveal>

          <Reveal direction="up" delay={0.12} className="mt-10">
            <article className="overflow-hidden rounded-2xl border border-border shadow-sm lg:grid lg:grid-cols-2">
              <div className="p-8">
                <h3 className="text-brand">{vehicle.name}</h3>
                <p className="mt-2 text-2xl font-bold text-ink">
                  <i className="fa fa-eur mr-2" aria-hidden />
                  {vehicle.price}
                </p>
                <p className="mt-4 text-body">{vehicle.description}</p>
                <Link href={vehicle.ctaHref} className="btn btn-primary mt-6">
                  {vehicle.cta}
                </Link>
              </div>
              <div className="border-t border-border bg-soft p-8 lg:border-t-0 lg:border-l">
                <ul className="space-y-3">
                  {vehicle.specs.map((spec) => (
                    <li key={spec} className="text-body">
                      <i className="fa fa-check-circle mr-2 text-brand" aria-hidden />
                      {spec}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-xl bg-muted px-4 py-3 text-body">
                  {vehicle.footer}
                </p>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="bg-white pb-24">
        <div className="container-mbt">
          <Reveal direction="fade">
            <VehicleCarousel
              labels={["Photo véhicule 1", "Photo véhicule 2", "Photo véhicule 3"]}
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
