"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";

const photos = [
  "foto-01.jpeg",
  "foto-02.jpeg",
  "foto-03.jpeg",
  "foto-04.jpeg",
  "foto-05.jpeg",
  "foto-06.jpeg",
  "foto-07.jpeg",
  "foto-08.jpeg",
  "foto-09.jpeg",
  "foto-10.jpeg"
].map((filename, index) => ({
  src: `/fotosCarrossel/${filename}`,
  alt: `Ryan e Juliana no Chá de Casa Nova - foto ${index + 1}`
}));

export function CoupleCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const carousel = carouselRef.current;

      if (!carousel) {
        return;
      }

      const distance = carousel.clientWidth * 0.82;
      const nextLeft = carousel.scrollLeft + distance;
      const shouldRestart = nextLeft >= carousel.scrollWidth - carousel.clientWidth - 8;

      carousel.scrollTo({
        left: shouldRestart ? 0 : nextLeft,
        behavior: "smooth"
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  function scroll(direction: "previous" | "next") {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    const distance = carousel.clientWidth * 0.82;
    const nextLeft = direction === "next" ? carousel.scrollLeft + distance : carousel.scrollLeft - distance;
    const shouldRestart = direction === "next" && nextLeft >= carousel.scrollWidth - carousel.clientWidth - 8;

    carousel.scrollTo({
      left: shouldRestart ? 0 : Math.max(0, nextLeft),
      behavior: "smooth"
    });
  }

  return (
    <div className="relative w-full">
      <div
        ref={carouselRef}
        className="carousel-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3"
        aria-label="Fotos de Ryan e Juliana"
      >
        {photos.map((photo, index) => (
          <figure
            key={photo.src}
            className="relative aspect-[4/5] w-[78vw] max-w-[360px] shrink-0 snap-center overflow-hidden rounded-lg bg-blueink-50 shadow-sm sm:w-[330px] lg:w-[360px]"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              priority={index < 2}
              sizes="(max-width: 640px) 78vw, 360px"
              className="object-cover"
            />
          </figure>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => scroll("previous")}
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-blueink-200 bg-white text-blueink-800 shadow-sm transition hover:bg-blueink-50"
          aria-label="Foto anterior"
          title="Foto anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => scroll("next")}
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-blueink-200 bg-white text-blueink-800 shadow-sm transition hover:bg-blueink-50"
          aria-label="Próxima foto"
          title="Próxima foto"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
