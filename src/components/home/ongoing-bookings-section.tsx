"use client";

import { useRef } from "react";
import { Link } from "@/components/ui/locale-link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper/types";
import type { OngoingBooking } from "@/lib/mock-data/ongoing-bookings";
import { OngoingBookingCard } from "@/components/home/ongoing-booking-card";
import { MobileOngoingBookingCard } from "@/components/home/mobile-ongoing-booking-card";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DoubleChevronRightIcon,
} from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

import "swiper/css";
import "swiper/css/navigation";

export function OngoingBookingsSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: OngoingBooking[];
}) {
  const swiperRef = useRef<SwiperClass | null>(null);
  const { t } = useTranslation();

  return (
    <section className="commonPY">
      {/* Mobile — flat title + plain "View All" link, horizontal-scroll cards */}
      <div className="container flex flex-col gap-3 lg:hidden">
        <div className="flex items-center gap-4">
          <h2 className="flex-1 text-base font-medium text-text-primary">{title}</h2>
          <AppButton
            asChild
            variant="link"
            size="sm"
            className="h-auto shrink-0 p-0 text-sm text-button-link-primary-text hover:text-button-link-primary-text"
          >
            <Link href="/general-bookings">{t("home.ongoingBookings.viewAll")}</Link>
          </AppButton>
        </div>

        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto scroll-px-4 px-4">
          {items.map((booking) => (
            <MobileOngoingBookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      </div>

      <div className="container hidden flex-col gap-7 lg:flex">
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-text-primary sm:text-2xl">{title}</h2>
            <p className="text-base text-text-secondary sm:text-lg">{description}</p>
          </div>
          <AppButton
            asChild
            variant="link"
            size="sm"
            className="shrink-0 gap-2 p-0 text-base text-button-link-primary-text hover:text-button-link-primary-text"
          >
            <Link href="/general-bookings">
              <span className="hidden sm:inline">{t("home.ongoingBookings.viewAll")}</span>
              <DoubleChevronRightIcon className="size-4 rtl:rotate-180" />
            </Link>
          </AppButton>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Swiper
            modules={[Navigation]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1200: { slidesPerView: 3.2 },
            }}
            className="w-full"
          >
            {items.map((booking) => (
              <SwiperSlide key={booking.id}>
                <OngoingBookingCard booking={booking} />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="flex items-start gap-2">
            <AppButton
              variant="link"
              size="md"
              iconOnly
              leftIcon={(iconProps) => <ArrowLeftIcon {...iconProps} className="size-6 rtl:rotate-180" />}
              aria-label={t("home.ongoingBookings.previous")}
              onClick={() => swiperRef.current?.slidePrev()}
              className="rounded-lg text-button-link-secondary-text transition-colors duration-200 hover:bg-bg-inverse hover:text-icon-inverse"
            >
              {t("home.ongoingBookings.previous")}
            </AppButton>
            <AppButton
              variant="link"
              size="md"
              iconOnly
              leftIcon={(iconProps) => <ArrowRightIcon {...iconProps} className="size-6 rtl:rotate-180" />}
              aria-label={t("home.ongoingBookings.next")}
              onClick={() => swiperRef.current?.slideNext()}
              className="rounded-lg text-button-link-secondary-text transition-colors duration-200 hover:bg-bg-inverse hover:text-icon-inverse"
            >
              {t("home.ongoingBookings.next")}
            </AppButton>
          </div>
        </div>
      </div>
    </section>
  );
}
