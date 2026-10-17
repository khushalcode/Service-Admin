"use client";

import { useRef } from "react";
import { Link } from "@/components/ui/locale-link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper/types";
import type { PreviousBooking } from "@/lib/mock-data/previous-bookings";
import { PreviousBookingCard } from "@/components/home/previous-booking-card";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DoubleChevronRightIcon,
} from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

import "swiper/css";
import "swiper/css/navigation";

export function PreviousBookingsSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: PreviousBooking[];
}) {
  const swiperRef = useRef<SwiperClass | null>(null);
  const { t } = useTranslation();

  return (
    <section className="commonPY">
      <div className="container flex flex-col gap-7">
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
              <span className="hidden sm:inline">{t("home.previousBookings.viewAll")}</span>
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
              1200: { slidesPerView: 4 },
            }}
            className="w-full"
          >
            {items.map((booking) => (
              <SwiperSlide key={booking.id}>
                <PreviousBookingCard booking={booking} />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="flex items-start gap-2">
            <AppButton
              variant="link"
              size="md"
              iconOnly
              leftIcon={(iconProps) => <ArrowLeftIcon {...iconProps} className="size-6 rtl:rotate-180" />}
              aria-label={t("home.previousBookings.previous")}
              onClick={() => swiperRef.current?.slidePrev()}
              className="rounded-lg text-button-link-secondary-text transition-colors duration-200 hover:bg-bg-inverse hover:text-icon-inverse"
            >
              {t("home.previousBookings.previous")}
            </AppButton>
            <AppButton
              variant="link"
              size="md"
              iconOnly
              leftIcon={(iconProps) => <ArrowRightIcon {...iconProps} className="size-6 rtl:rotate-180" />}
              aria-label={t("home.previousBookings.next")}
              onClick={() => swiperRef.current?.slideNext()}
              className="rounded-lg text-button-link-secondary-text transition-colors duration-200 hover:bg-bg-inverse hover:text-icon-inverse"
            >
              {t("home.previousBookings.next")}
            </AppButton>
          </div>
        </div>
      </div>
    </section>
  );
}
