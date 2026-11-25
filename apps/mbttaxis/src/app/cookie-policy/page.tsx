import type { Metadata } from "next";
import { cookies } from "../../../content/cookies";

export const metadata: Metadata = {
  title: cookies.meta.title,
  description: cookies.meta.description,
};

export default function CookiePolicyPage() {
  return (
    <section className="bg-white pt-36 pb-24">
      <div className="container-mbt max-w-3xl">
        <h1 className="text-ink">{cookies.page.title}</h1>
        {cookies.page.intro.map((p) => (
          <p key={p.slice(0, 48)} className="mt-4 text-body">
            {p}
          </p>
        ))}

        {cookies.page.sections.map((section) => (
          <div key={section.title} className="mt-10">
            <h2 className="text-brand">{section.title}</h2>
            {"intro" in section && section.intro ? (
              <p className="mt-4 text-body">{section.intro}</p>
            ) : null}
            {"list" in section && section.list ? (
              <ul className="mt-3 list-disc space-y-1 pl-6 text-body">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {"paragraphs" in section && section.paragraphs
              ? section.paragraphs.map((p) => (
                  <p key={p.slice(0, 48)} className="mt-4 text-body">
                    {p}
                  </p>
                ))
              : null}
            {"subsections" in section && section.subsections
              ? section.subsections.map((sub) => (
                  <div key={sub.title} className="mt-6">
                    <h3 className="text-lg text-ink">{sub.title}</h3>
                    <p className="mt-2 text-body">{sub.text}</p>
                  </div>
                ))
              : null}
            {"closing" in section && section.closing ? (
              <p className="mt-4 text-body">{section.closing}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
