"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { home } from "../../content/home";

export function TestimonialsCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [index, setIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="bg-white py-20">
      <div className="container-mbt relative max-w-3xl text-center">
        <i className="fa fa-quote-left mb-6 text-4xl text-ink" aria-hidden />
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {home.testimonials.map((item) => (
              <blockquote key={item.author} className="min-w-0 shrink-0 grow-0 basis-full px-4">
                <p className="text-xl italic text-body md:text-2xl">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-6 font-bold text-ink">{item.author}</footer>
              </blockquote>
            ))}
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
            aria-label="Précédent"
            onClick={() => emblaApi?.scrollPrev()}
          >
            <i className="fa fa-chevron-left" aria-hidden />
          </button>
          <div className="flex gap-2">
            {home.testimonials.map((item, i) => (
              <button
                key={item.author}
                type="button"
                aria-label={`Avis ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full ${i === index ? "bg-brand" : "bg-muted"}`}
                onClick={() => emblaApi?.scrollTo(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
            aria-label="Suivant"
            onClick={() => emblaApi?.scrollNext()}
          >
            <i className="fa fa-chevron-right" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
