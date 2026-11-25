import type { Metadata } from "next";
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
        <div className="container-mbt">
          <Reveal direction="left">
            <p className="font-medium text-brand">{about.hero.eyebrow}</p>
            <h1 className="mt-2 max-w-3xl text-ink">{about.hero.title}</h1>
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

      <section className="bg-white pb-16">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-brand">{about.innovate.title}</h2>
            {about.innovate.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 max-w-4xl text-body">
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="bg-brand py-16 text-white">
        <div className="container-mbt">
          <Reveal direction="left">
            {about.innovate.banner.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 max-w-4xl text-white/90 first:mt-0">
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-mbt">
          <Reveal direction="up">
            <h2 className="text-brand">{about.poles.title}</h2>
            <p className="mt-2 text-xl text-ink">{about.poles.subtitle}</p>
            <p className="mt-6 max-w-4xl text-body">{about.poles.intro}</p>
            <ul className="mt-6 list-disc space-y-2 pl-6 text-body">
              {about.poles.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>

          {/* Original : grande photo à gauche + 4 tuiles colorées (2×2) */}
          <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-2 lg:gap-6">
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
    </>
  );
}
