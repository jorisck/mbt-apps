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
        {cookies.page.paragraphs.map((p) => (
          <p key={p.slice(0, 48)} className="mt-4 text-body">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
