"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText } from "lucide-react";
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon } from "@/components/icons/icons";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { CartGroup } from "@/lib/cart-types";

/** Mobile-only collapsible bill summary — same numbers desktop shows inline
 * in CheckoutOrderSummary's sidebar (item total, visiting charge, taxes,
 * fees, promo discount, final amount), just its own expandable card here.
 * Collapsed state is a compact "Total Bill $X, $Y · Saved $Z" summary row;
 * expanded shows the full breakdown. */
export function MobileBillDetailsSection({
  cartGroup,
  finalAmount,
  promoDiscount,
}: {
  cartGroup: CartGroup;
  finalAmount: number;
  promoDiscount: number;
}) {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const [expanded, setExpanded] = useState(true);

  const itemTotal = cartGroup.subTotalWithoutTax ?? 0;
  const visitingCharge = cartGroup.visitingCharges ?? 0;
  const taxValue = cartGroup.taxValue ?? 0;
  const feesTotal = cartGroup.feesTotal ?? 0;
  const originalTotal = cartGroup.overallAmount ?? cartGroup.subTotal;

  return (
    <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3 lg:hidden">
      {expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex w-full items-center justify-between gap-2"
        >
          <span className="text-sm font-semibold text-text-primary">
            {t("checkoutPage.orderSummary.billDetails")}
          </span>
          <span className="flex size-9 items-center justify-center rounded-full bg-bg-secondary">
            <ChevronUpIcon className="size-5 text-icon-primary" />
          </span>
        </button>
      ) : (
        <button type="button" onClick={() => setExpanded(true)} className="flex w-full items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-bg-secondary">
            <FileText className="size-4 text-icon-primary" />
          </span>
          <div className="flex flex-1 flex-col items-start gap-1">
            <span className="text-sm text-text-primary">
              {t("checkoutPage.orderSummary.totalBillLabel")}{" "}
              {promoDiscount > 0 && <span className="line-through">{showPrice(originalTotal)}</span>}
              {promoDiscount > 0 && ", "}
              <span className="font-semibold">{showPrice(finalAmount)}</span>
            </span>
            {promoDiscount > 0 && (
              <span className="rounded-sm bg-bg-brand-subtle px-1 py-1 text-xs text-text-brand">
                {t("checkoutPage.orderSummary.savedAmount", { amount: showPrice(promoDiscount) })}
              </span>
            )}
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-bg-secondary">
            <ChevronDownIcon className="size-5 text-icon-primary" />
          </span>
        </button>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="bill-details-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex w-full flex-col items-start gap-3 overflow-hidden"
          >
            <div className="h-px w-full border-t border-dashed border-border-default" />
            <div className="flex w-full flex-col items-start gap-2">
              <div className="flex w-full items-center gap-1">
                <span className="flex-1 text-sm text-text-secondary">
                  {t("checkoutPage.orderSummary.itemTotal")}
                </span>
                <span className="text-sm text-text-primary">{showPrice(itemTotal)}</span>
              </div>
              {visitingCharge > 0 && (
                <div className="flex w-full items-center gap-1">
                  <span className="flex-1 text-sm text-text-secondary">
                    {t("checkoutPage.orderSummary.visitingCharge")}
                  </span>
                  <span className="text-sm text-text-primary">{showPrice(visitingCharge)}</span>
                </div>
              )}
              {taxValue > 0 && (
                <div className="flex w-full items-center gap-1">
                  <span className="flex-1 text-sm text-text-secondary">{t("cartPage.taxesLabel")}</span>
                  <span className="text-sm text-text-primary">+{showPrice(taxValue)}</span>
                </div>
              )}
              {feesTotal > 0 && (
                <div className="flex w-full items-center gap-1">
                  <span className="flex-1 text-sm text-text-secondary">
                    {t("checkoutPage.orderSummary.extraCharges")}
                  </span>
                  <span className="text-sm text-text-primary">+{showPrice(feesTotal)}</span>
                </div>
              )}
              <div className="h-px w-full bg-border-muted" />
              <div className="flex w-full items-center gap-1">
                <span className="flex-1 text-sm font-semibold text-text-primary">
                  {t("cartPage.finalAmount")}
                </span>
                <span className="text-base font-bold text-text-brand">{showPrice(finalAmount)}</span>
              </div>
            </div>

            {promoDiscount > 0 && (
              <div className="flex w-full items-center gap-2 rounded-lg bg-bg-success-subtle p-2">
                <CheckCircleIcon className="size-6 shrink-0 text-text-success" />
                <span className="text-xs text-text-success">
                  {t("checkoutPage.orderSummary.savedBanner", { amount: showPrice(promoDiscount) })}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
