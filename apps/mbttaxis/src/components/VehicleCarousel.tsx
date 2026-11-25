"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ImagePlaceholder } from "./ImagePlaceholder";

type Props = {
  labels: string[];
};

export function VehicleCarousel({ labels }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
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
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {labels.map((label) => (
            <div key={label} className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/3">
              <ImagePlaceholder label={label} ratio="aspect-[3/4]" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
          aria-label="Précédent"
          onClick={() => emblaApi?.scrollPrev()}
        >
          <i className="fa fa-chevron-left" aria-hidden />
        </button>
        <div className="flex gap-2">
          {labels.map((label, i) => (
            <button
              key={label}
              type="button"
              aria-label={`Photo ${i + 1}`}
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
  );
}
