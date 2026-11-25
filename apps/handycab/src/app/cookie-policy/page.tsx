import type { Metadata } from "next";
import { privacy } from "../../../content/pages";
import { site } from "../../../content/site";
import { FaqSection } from "../../components/FaqSection";
import { SectionDivider } from "../../components/SectionDivider";

export const metadata: Metadata = {
  title: privacy.seo.title,
  description: privacy.seo.description,
};

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-20 pt-40 md:pt-44">
      <h1 className="font-display text-[32px] font-bold leading-tight text-brand-dark sm:text-[40px]">
        {privacy.title}
      </h1>
      <p className="mt-5 text-[16px] leading-relaxed text-slate-600">
        {privacy.intro}
      </p>

      <SectionDivider />

      <h2 className="mt-2 text-[22px] font-bold text-brand-dark">
        Données susceptibles d’être traitées
      </h2>
      <ul className="mt-4 space-y-2 text-[14px] text-slate-700">
        {privacy.data.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>

      <SectionDivider variant="glow" />

      <h2 className="text-[22px] font-bold text-brand-dark">Finalités</h2>
      <ul className="mt-4 space-y-2 text-[14px] text-slate-700">
        {privacy.purposes.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>

      <SectionDivider variant="steps" />

      <h2 className="text-[22px] font-bold text-brand-dark">
        Données liées à la mobilité
      </h2>
      <p className="mt-4 text-[14px] leading-relaxed text-slate-600">
        {privacy.sensitive}
      </p>

      <h2 className="mt-10 text-[22px] font-bold text-brand-dark">Cookies</h2>
      <p className="mt-4 text-[14px] leading-relaxed text-slate-600">
        {privacy.cookies}
      </p>

      <h2 className="mt-10 text-[22px] font-bold text-brand-dark">Vos droits</h2>
      <ul className="mt-4 space-y-2 text-[14px] text-slate-700">
        {privacy.rights.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>

      <p className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-5 text-[14px] text-slate-600">
        Pour exercer vos droits :{" "}
        <a
          href={`mailto:${site.email}`}
          className="font-semibold text-brand-accent hover:underline"
        >
          {site.email}
        </a>
        .
      </p>

      <FaqSection
        items={privacy.faq.items}
        title={privacy.faq.title}
        intro={privacy.faq.intro}
        showMoreHref="/aide#faq"
        divider
      />
    </div>
  );
}
