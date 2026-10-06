"use client";

import { Link } from "@/components/ui/locale-link";
import { ArrowRight, Calendar, Star } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";
import { formatRating } from "@/lib/helpers";
import { useRebook } from "@/lib/checkout/use-rebook";
import type { PreviousBooking } from "@/lib/mock-data/previous-bookings";

export function MobilePreviousBookingCard({ booking }: { booking: PreviousBooking }) {
  const { t } = useTranslation();
  const { rebook, isRebooking } = useRebook();

  return (
    <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-border-default bg-bg-primary">
      <div className="flex items-center gap-2 border-b border-border-default bg-bg-secondary p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-default bg-bg-primary">
          <Calendar className="size-4 text-icon-primary" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs text-text-secondary">{t("home.previousBookings.dateTime")}</span>
          <span className="truncate text-xs font-medium text-text-primary">
            {booking.date} - {booking.time}
          </span>
        </div>
        {booking.rating !== null && (
          <span className="flex shrink-0 items-center gap-1 rounded-lg border border-border-default bg-bg-primary px-1.5 py-1">
            <Star className="size-3.5 fill-bg-warning text-bg-warning" />
            <span className="text-xs text-text-primary">{formatRating(booking.rating)}</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-3">
        <span className="line-clamp-1 text-sm font-medium text-text-primary">{booking.title}</span>

        <div className="flex items-center gap-2">
          <AppImage
            src={booking.providerAvatar}
            alt={booking.providerName}
            className="size-8 shrink-0 rounded-md object-cover"
          />
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-xs text-text-secondary">{t("common.provider")}</span>
            <span className="line-clamp-1 text-xs font-medium text-text-primary">{booking.providerName}</span>
          </div>
        </div>

        <div className="mt-auto h-px w-full bg-border-default" />

        <div className="flex w-full items-center gap-2">
          {booking.isReorderAllowed && (
            <AppButton
              variant="secondary"
              size="sm"
              className="flex-1 justify-center"
              disabled={isRebooking(booking.orderId)}
              onClick={() => rebook(booking.orderId)}
            >
              {t("home.previousBookings.bookAgain")}
            </AppButton>
          )}
          <AppButton
            asChild
            variant="secondary-outline"
            size="sm"
            className="flex-1 justify-center gap-1"
          >
            <Link href={booking.providerHref}>
              {t("common.viewDetails")}
              <ArrowRight className="size-3.5 shrink-0 rtl:rotate-180" />
            </Link>
          </AppButton>
        </div>
      </div>
    </div>
  );
}
