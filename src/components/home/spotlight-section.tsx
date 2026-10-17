"use client";

import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import type { HeroSlide } from "@/components/home/hero";

/** "In the spotlight" — admin banners shown as a row of rounded promo cards. */
export function SpotlightSection({ slides }: { slides: HeroSlide[] }) {
  if (slides.length === 0) return null;
  return (
    <section className="container flex flex-col gap-4 py-6 lg:py-10">
      <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">In the spotlight</h2>
      <div className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] lg:grid lg:grid-cols-3 lg:overflow-visible">
        {slides.slice(0, 6).map((slide) => (
          <Link
            key={slide.id}
            href={slide.href}
            className="relative aspect-video w-[85%] shrink-0 snap-start overflow-hidden rounded-xl border border-border-default sm:w-[60%] lg:w-auto"
          >
            <AppImage src={slide.webImage} alt={slide.imageAlt} fill className="object-cover" />
          </Link>
        ))}
      </div>
    </section>
  );
}
