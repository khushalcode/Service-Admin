"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAllPromocodesApi, validatePromoCodeApi, type PromoCodeApi } from "@/api/apiRoutes";
import { extractErrorMessage } from "@/lib/checkout/checkout-types";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Shared promo-code state/logic between checkout (one fixed provider) and
 * the cart page (provider can change via the radio select) — refetches
 * offers and resets any applied promo whenever `providerId` changes. */
export function usePromoCode(providerId: number | null, subtotal: number) {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<PromoCodeApi[]>([]);
  const [offersStatus, setOffersStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeApi | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoStatus, setPromoStatus] = useState<"idle" | "applying" | "error">("idle");
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoStatus("idle");
    setPromoError(null);
    if (providerId == null) {
      setOffers([]);
      setOffersStatus("idle");
      return;
    }
    let cancelled = false;
    setOffersStatus("loading");
    getAllPromocodesApi({ provider_id: providerId, limit: 50 })
      .then((response) => {
        if (cancelled) return;
        setOffers(response?.error ? [] : (response?.data ?? []));
        setOffersStatus("loaded");
      })
      .catch(() => {
        if (cancelled) return;
        setOffers([]);
        setOffersStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const applyPromo = async (offer: PromoCodeApi) => {
    if (providerId == null) return;
    setPromoStatus("applying");
    setPromoError(null);
    try {
      const response = await validatePromoCodeApi({
        partner_id: providerId,
        promo_code_id: offer.id,
        final_total: subtotal,
      });
      if (response?.error) throw new Error(response?.message);
      const discount = Number(response?.data?.[0]?.final_discount ?? 0);
      setAppliedPromo(offer);
      setPromoDiscount(Number.isFinite(discount) ? discount : 0);
      setPromoStatus("idle");
    } catch (error) {
      const message = extractErrorMessage(error, t("checkoutPage.errors.promoInvalid"));
      setPromoStatus("error");
      setPromoError(message);
      toast.error(message);
    }
  };

  const applyPromoCode = (code: string) => {
    const offer = offers.find((item) => item.promo_code.toLowerCase() === code.trim().toLowerCase());
    if (!offer) {
      setPromoStatus("error");
      setPromoError(t("checkoutPage.errors.promoInvalid"));
      return;
    }
    applyPromo(offer);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoStatus("idle");
    setPromoError(null);
  };

  return {
    offers,
    offersStatus,
    appliedPromo,
    promoDiscount,
    promoStatus,
    promoError,
    applyPromo,
    applyPromoCode,
    removePromo,
  };
}
