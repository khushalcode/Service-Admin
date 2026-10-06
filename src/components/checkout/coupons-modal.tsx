"use client";

import { useState } from "react";
import { parse, format, isValid } from "date-fns";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import { CloseIcon } from "@/components/icons/icons";
import type { PromoCodeApi } from "@/api/apiRoutes";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";

function formatExpiry(rawDate: string): string {
  // Live API returns dd-MM-yyyy regardless of the documented yyyy-MM-dd example.
  const parsed = parse(rawDate, "dd-MM-yyyy", new Date());
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : rawDate;
}

export function CouponsModal({
  open,
  onOpenChange,
  offers,
  offersStatus,
  appliedPromoId,
  promoStatus,
  onApply,
  onApplyCode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offers: PromoCodeApi[];
  offersStatus: "idle" | "loading" | "loaded" | "error";
  appliedPromoId: number | null;
  promoStatus: "idle" | "applying" | "error";
  onApply: (offer: PromoCodeApi) => void;
  onApplyCode: (code: string) => void;
}) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const [couponCode, setCouponCode] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[600px] gap-0 overflow-hidden p-0 sm:max-w-[600px]"
        showCloseButton={false}
      >
        <div className="flex w-full items-start gap-8 border-b border-border-default px-6 py-4">
          <div className="flex flex-1 flex-col items-start gap-0.5">
            <DialogTitle className="text-xl font-medium text-text-primary">
              {t("checkoutPage.coupons.modalTitle")}
            </DialogTitle>
            <span className="text-sm text-text-secondary">{t("checkoutPage.coupons.modalSubtitle")}</span>
          </div>
          <AppButton
            variant="secondary-outline"
            size="sm"
            iconOnly
            leftIcon={CloseIcon}
            aria-label={t("checkoutPage.coupons.closeAriaLabel")}
            onClick={() => onOpenChange(false)}
          >
            {t("checkoutPage.coupons.closeAriaLabel")}
          </AppButton>
        </div>

        <div className="flex max-h-[70vh] w-full flex-col items-start gap-6 overflow-y-auto p-6">
          <div className="flex w-full items-start gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder={t("cartPage.enterCoupon")}
              className="h-auto flex-1 rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-text-primary outline-none placeholder:text-form-field-placeholder focus-visible:border-border-brand"
            />
            <AppButton
              variant="primary"
              size="sm"
              disabled={!couponCode || promoStatus === "applying"}
              onClick={() => onApplyCode(couponCode)}
            >
              {t("cartPage.apply")}
            </AppButton>
          </div>

          {offersStatus === "loading" && (
            <div className="flex w-full flex-col gap-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          )}

          {offersStatus === "loaded" && offers.length === 0 && (
            <span className="text-sm text-text-secondary">{t("checkoutPage.coupons.noOffers")}</span>
          )}

          {offers.map((offer) => {
            const discountLabel =
              offer.discount_type === "percentage"
                ? t("checkoutPage.coupons.percentOff", { percent: offer.discount })
                : t("checkoutPage.coupons.amountOff", { amount: showPrice(Number(offer.discount)) });
            const isApplied = offer.id === appliedPromoId;

            const terms = [
              offer.message || null,
              t("checkoutPage.coupons.minimumOrderTerm", { amount: showPrice(offer.minimum_order_amount) }),
              t("checkoutPage.coupons.maxDiscountTerm", { amount: showPrice(offer.max_discount_amount) }),
              t("checkoutPage.coupons.validFromTerm", {
                start: formatExpiry(offer.start_date),
                end: formatExpiry(offer.end_date),
              }),
              offer.no_of_repeat_usage > 1
                ? t("checkoutPage.coupons.limitedUsesTerm", { count: offer.no_of_repeat_usage })
                : t("checkoutPage.coupons.validOnceTerm"),
            ].filter((term): term is string => Boolean(term));

            return (
              <div
                key={offer.id}
                className="flex w-full items-stretch overflow-hidden rounded-xl border border-border-default bg-bg-primary"
              >
                <div className="flex w-14 shrink-0 items-center justify-center rounded-l-xl bg-bg-brand py-4">
                  <span
                    className="rotate-180 whitespace-nowrap text-2xl font-semibold text-text-inverse-light [writing-mode:vertical-rl]"
                  >
                    {discountLabel}
                  </span>
                </div>

                <div className="flex flex-1 flex-col items-start gap-4 p-4">
                  <div className="flex w-full items-center gap-3">
                    {offer.image && (
                      <AppImage
                        src={offer.image}
                        alt={offer.promo_code}
                        className="size-14 rounded-lg border border-border-default object-cover"
                      />
                    )}
                    <div className="flex flex-1 flex-col items-start gap-2">
                      <span className="text-sm text-text-primary">{offer.promo_code}</span>
                      {offer.end_date && (
                        <span className="text-sm text-text-secondary">
                          {t("checkoutPage.coupons.expiresOn", { date: formatExpiry(offer.end_date) })}
                        </span>
                      )}
                    </div>
                    <AppButton
                      variant="secondary"
                      size="md"
                      disabled={isApplied || promoStatus === "applying"}
                      onClick={() => onApply(offer)}
                    >
                      {isApplied ? t("checkoutPage.coupons.applied") : t("cartPage.apply")}
                    </AppButton>
                  </div>

                  {terms.length > 0 && (
                    <>
                      <div className="h-px w-full border-t border-dashed border-border-strong" />
                      <ul className="flex w-full flex-col items-start gap-1">
                        {terms.map((term) => (
                          <li key={term} className="text-sm text-text-primary">
                            • {term}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
