import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getServicePage,
  serviceNavLabels,
  servicePages,
  serviceSlugs,
  type ServiceSlug,
} from "../../../../content/service-pages";
import { Reveal, RevealItem, RevealStagger } from "../../../components/Reveal";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return serviceSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return {};
  return {
    title: page.meta.title,
    description: page.meta.description,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) notFound();

  const related = page.related.slugs
    .map((s) => servicePages[s])
    .filter(Boolean);

  return (
    <>
      <section className="bg-soft pt-36 pb-16">
        <div className="container-mbt max-w-4xl">
          <Reveal direction="up">
            <p className="text-sm font-semibold tracking-[0.12em] text-brand uppercase">
              {page.hero.eyebrow}
            </p>
            <h1 className="mt-3 text-ink">{page.hero.title}</h1>
            <p className="mt-4 text-body">{page.hero.text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={page.hero.primaryHref}
                className="btn btn-primary"
                {...(page.hero.primaryHref.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {page.hero.primaryCta}
              </Link>
              <a
                href={page.hero.secondaryHref}
                className="btn btn-secondary"
                {...(page.hero.secondaryHref.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {page.hero.secondaryCta}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt grid items-center gap-10 lg:grid-cols-2">
          <Reveal direction="left">
            <h2 className="text-brand">{page.intro.title}</h2>
            {page.intro.paragraphs.map((p) => (
              <p key={p.slice(0, 48)} className="mt-4 text-body">
                {p}
              </p>
            ))}
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src={page.image.src}
                alt={page.image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-brand">{page.useCases.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-body">
              {page.useCases.intro}
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-6 sm:grid-cols-2">
            {page.useCases.items.map((item) => (
              <RevealItem key={item.title} direction="up">
                <article className="h-full rounded-2xl border border-border bg-white p-6">
                  <h3 className="text-xl text-ink">{item.title}</h3>
                  <p className="mt-3 text-body">{item.text}</p>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt max-w-4xl">
          <Reveal direction="up">
            <h2 className="text-brand">{page.process.title}</h2>
            <p className="mt-4 text-body">{page.process.intro}</p>
          </Reveal>
          <ol className="mt-10 space-y-6">
            {page.process.steps.map((step, index) => (
              <Reveal key={step.title} direction="up">
                <li className="flex gap-5 rounded-2xl border border-border p-6">
                  <span className="font-[family-name:var(--font-poppins)] text-3xl font-bold text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-xl text-ink">{step.title}</h3>
                    <p className="mt-2 text-body">{step.text}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-center text-brand">{page.advantages.title}</h2>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-6 md:grid-cols-2">
            {page.advantages.items.map((item) => (
              <RevealItem key={item.title} direction="up">
                <article className="h-full rounded-2xl border border-border bg-white p-6">
                  <h3 className="text-xl text-ink">{item.title}</h3>
                  <p className="mt-3 text-body">{item.text}</p>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
          {page.trust ? (
            <Reveal direction="up">
              <p className="mx-auto mt-10 max-w-3xl rounded-xl bg-white px-5 py-4 text-center text-sm font-medium text-ink shadow-sm">
                {page.trust}
              </p>
            </Reveal>
          ) : null}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt max-w-3xl">
          <Reveal direction="up">
            <h2 className="text-center text-ink">{page.faq.title}</h2>
          </Reveal>
          <div className="mt-10 space-y-4">
            {page.faq.items.map((item) => (
              <Reveal key={item.q} direction="up">
                <details className="rounded-2xl border border-border bg-white p-5 open:shadow-sm">
                  <summary className="cursor-pointer list-none font-[family-name:var(--font-poppins)] text-lg font-bold text-ink">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-body">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="bg-soft py-16">
          <div className="container-mbt">
            <Reveal direction="up">
              <h2 className="text-center text-brand">{page.related.title}</h2>
            </Reveal>
            <RevealStagger className="mt-10 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <RevealItem key={item.slug} direction="up">
                  <Link
                    href={`/services/${item.slug}`}
                    className="block h-full rounded-2xl border border-border bg-white p-6 transition hover:border-brand"
                  >
                    <p className="text-sm font-bold text-brand">
                      {serviceNavLabels[item.slug as ServiceSlug]}
                    </p>
                    <h3 className="mt-2 text-lg text-ink">{item.hero.title}</h3>
                    <p className="mt-3 line-clamp-3 text-body">{item.hero.text}</p>
                    <span className="mt-4 inline-block text-sm font-semibold text-brand">
                      En savoir plus →
                    </span>
                  </Link>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>
      ) : null}

      <section className="bg-brand py-16 text-white">
        <div className="container-mbt max-w-3xl text-center">
          <Reveal direction="up">
            <h2 className="heading-on-brand">{page.finalCta.title}</h2>
            <p className="mt-4 text-white/90">{page.finalCta.text}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={page.finalCta.primaryHref}
                className="btn btn-outline-light"
                {...(page.finalCta.primaryHref.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {page.finalCta.primaryCta}
              </Link>
              <a
                href={page.finalCta.secondaryHref}
                className="btn btn-outline-light"
                {...(page.finalCta.secondaryHref.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {page.finalCta.secondaryCta}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
