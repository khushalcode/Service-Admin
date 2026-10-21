"use client";

import { ShieldCheck, BadgeIndianRupee, Award } from "lucide-react";
import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { getCategoryIcon } from "@/lib/category-icons";
import type { CategoryApi } from "@/lib/home-screen";
import whyChooseUs from "@/assets/home/why_choose_us.png";
import cta from "@/assets/home/cta.png";
import smilingMen from "@/assets/home/smiling_men.png";

const TRUST = [
  { icon: ShieldCheck, label: "Police verified staff" },
  { icon: BadgeIndianRupee, label: "Transparent pricing" },
  { icon: Award, label: "Quality guaranteed" },
];

/**
 * "Home services at your doorstep" hero — headline + quick-pick category tiles
 * on the left, photo collage on the right (layout inspired by Urban Company).
 * Tiles come from the home screen's category section; photos come from the
 * admin sliders when available, otherwise local fallbacks.
 */
export function UrbanHero({
  categories,
  photos,
}: {
  categories: CategoryApi[];
  photos: string[];
}) {
  const tiles = categories.slice(0, 5);
  const collage = [photos[0] ?? whyChooseUs, photos[1] ?? cta, photos[2] ?? smilingMen];

  return (
    <section className="container grid items-center gap-8 py-8 lg:grid-cols-2 lg:gap-12 lg:py-14">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold leading-tight text-text-primary sm:text-4xl lg:text-5xl">
          Home services at your <span className="text-text-brand">doorstep</span>
        </h1>

        <div className="rounded-2xl border border-border-default bg-bg-primary p-4 sm:p-6">
          <p className="mb-4 text-base font-medium text-text-secondary">What are you looking for?</p>
          <div className="grid grid-cols-3 gap-3">
            {tiles.map((category) => (
              <Link
                key={category.id}
                href={`/services?categories=${category.slug}`}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-bg-brand-subtle transition-colors group-hover:bg-bg-brand">
                  <AppImage
                    src={getCategoryIcon({ name: category.name, slug: category.slug })}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </span>
                <span className="line-clamp-2 text-xs font-medium text-text-primary sm:text-sm">
                  {category.name}
                </span>
              </Link>
            ))}
            <Link href="/categories" className="group flex flex-col items-center gap-2 text-center">
              <span className="flex aspect-square w-full items-center justify-center rounded-xl bg-warning-50 transition-colors group-hover:bg-warning-500">
                <span className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className="size-1.5 rounded-full bg-text-primary" />
                  ))}
                </span>
              </span>
              <span className="text-xs font-medium text-text-primary sm:text-sm">All services</span>
            </Link>
          </div>
        </div>

        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {TRUST.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Icon className="size-5 text-icon-brand" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Photo collage — hidden on small screens, like the reference */}
      <div className="hidden h-[460px] grid-cols-2 grid-rows-2 gap-3 md:grid">
        <div className="relative row-span-1 overflow-hidden rounded-xl bg-bg-brand-subtle">
          <AppImage src={collage[0]} alt="" fill className="object-cover" />
        </div>
        <div className="relative row-span-2 overflow-hidden rounded-xl bg-bg-brand-subtle">
          <AppImage src={collage[2]} alt="" fill className="object-cover" />
        </div>
        <div className="relative row-span-1 overflow-hidden rounded-xl bg-bg-brand-subtle">
          <AppImage src={collage[1]} alt="" fill className="object-cover" />
        </div>
      </div>
    </section>
  );
}
