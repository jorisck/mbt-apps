import Image from "next/image";
import Link from "next/link";
import { home } from "../../content/home";

/**
 * HandyCab × MBT — jaune HandyCab adouci + neutres proches de MBT
 * (évite le contraste noir/jaune trop fort sur le site bleu).
 */
const HC = {
  yellow: "#f9cd1a",
  yellowSoft: "#fff8d6",
  yellowMid: "#f5e08a",
  ink: "#010102",
  body: "#495057",
  border: "#e8e4d0",
  surface: "#fbfaf5",
} as const;

export function HandycabCard() {
  const { handycab } = home;

  return (
    <section className="bg-white py-10 pb-20">
      <div className="container-mbt">
        <article
          className="relative overflow-hidden rounded-[1.75rem] border px-6 py-10 sm:px-10 sm:py-12 lg:px-14"
          style={{
            backgroundColor: HC.surface,
            borderColor: HC.border,
          }}
        >
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-70"
            style={{
              background: `linear-gradient(135deg, transparent 0%, ${HC.yellowSoft} 55%, ${HC.yellowMid} 100%)`,
            }}
            aria-hidden
          />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <Image
                  src="/images/logos/logo-handycab.png"
                  alt="Handycab"
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-2xl object-contain shadow-sm"
                />
                <p
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase"
                  style={{
                    backgroundColor: HC.yellowSoft,
                    borderColor: HC.border,
                    color: HC.ink,
                  }}
                >
                  {handycab.eyebrow}
                </p>
              </div>
              <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {handycab.title}
              </h2>
              <p className="mt-3 text-xl font-semibold sm:text-2xl" style={{ color: HC.ink }}>
                {handycab.tagline}
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed" style={{ color: HC.body }}>
                {handycab.text}
              </p>
              <ul className="mt-5 space-y-2">
                {handycab.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm" style={{ color: HC.body }}>
                    <i className="fa fa-check mt-0.5 shrink-0" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex shrink-0 flex-col gap-3">
              <Link
                href={handycab.primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: HC.yellow, color: HC.ink }}
              >
                {handycab.primaryCta}
                <i className="fa fa-external-link ml-2 text-sm" aria-hidden />
              </Link>
              <Link
                href={handycab.secondaryHref}
                className="inline-flex items-center justify-center rounded-full border px-7 py-3 text-base font-semibold transition-colors hover:bg-white"
                style={{ borderColor: HC.border, color: HC.ink }}
              >
                {handycab.secondaryCta}
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
