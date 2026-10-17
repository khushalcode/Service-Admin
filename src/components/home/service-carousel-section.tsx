"use client";

import { Link } from "@/components/ui/locale-link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import type { ServiceCardData } from "@/lib/mock-data/home-care-services";
import { ServiceCard } from "@/components/home/service-card";
import { AppButton } from "@/components/ui/app-button";
import {
  MOBILE_SLIDES_PER_VIEW,
  MOBILE_SLIDES_PER_VIEW_BREAKPOINT,
  MOBILE_SLIDES_SPACE_BETWEEN,
} from "@/lib/carousel-config";

import "swiper/css";
import "swiper/css/pagination";
import { DoubleChevronRightIcon } from "../icons/icons";

export function ServiceCarouselSection({
  title,
  description,
  ctaLabel,
  ctaHref,
  items,
  background,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  items: ServiceCardData[];
  background?: string;
}) {
  return (
    <section className={`${background ?? ""} commonPY`}>
      <div className="container flex flex-col gap-3 lg:gap-6">
        {/* Mobile header — Figma's flat title + plain "View All" link */}
        <div className="flex items-center gap-4 lg:hidden">
          <h2 className="flex-1 text-base font-medium text-text-primary">{title}</h2>
          <AppButton
            asChild
            variant="link"
            size="sm"
            className="h-auto shrink-0 p-0 text-sm text-button-link-primary-text hover:text-button-link-primary-text"
          >
            <Link href={ctaHref}>{ctaLabel}</Link>
          </AppButton>
        </div>

        <div className="hidden items-end justify-between gap-4 lg:flex">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-text-primary sm:text-2xl">{title}</h2>
            <p className="text-base text-text-secondary sm:text-lg">{description}</p>
          </div>
          <AppButton
            asChild
            variant="link"
            size="sm"
            className="shrink-0 gap-1 p-0 text-base text-button-link-primary-text hover:text-button-link-primary-text"
          >
            <Link href={ctaHref}>
              <span className="hidden sm:inline">{ctaLabel}</span>
              <DoubleChevronRightIcon className="size-4 rtl:rotate-180" />
            </Link>
          </AppButton>
        </div>

        <Swiper
          modules={[Pagination]}
          pagination={{
            clickable: true,
            renderBullet: (_index, className) =>
              `<span class="${className}"><span class="hcs-pagination-dot"></span></span>`,
          }}
          spaceBetween={MOBILE_SLIDES_SPACE_BETWEEN}
          slidesPerView={1}
          breakpoints={{
            [MOBILE_SLIDES_PER_VIEW_BREAKPOINT]: { slidesPerView: MOBILE_SLIDES_PER_VIEW },
            768: { slidesPerView: 1.5 },
            1024: { slidesPerView: 2.2 },
          }}
          className={`hcs-carousel w-full ${items?.length > 1 ? '' : `[&_.swiper-pagination]:hidden!`}`}
        >
          {items.map((service) => (
            <SwiperSlide key={service.id}>
              <ServiceCard service={service} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
