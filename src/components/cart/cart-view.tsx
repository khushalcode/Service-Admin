"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { EmptyCartIllustration } from "@/components/common/empty-cart-illustration";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/components/ui/locale-link";
import { ProviderCartCard } from "@/components/cart/provider-cart-card";
import { OrderSummary } from "@/components/cart/order-summary";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import { useCart } from "@/lib/use-cart";
import { usePromoCode } from "@/lib/checkout/use-promo-code";
import { manageCartApi, removeFromCartApi } from "@/api/apiRoutes";
import { normalizeCartResponse, mergeCartData } from "@/lib/cart-types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCartData } from "@/store/slices/cart-slice";

export function CartView() {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const { data, status } = useCart();
  const groups = data?.carts ?? [];

  // Checkout only ever books one provider's cart at a time — radio, not
  // checkboxes. null = user hasn't touched selection yet — derive the
  // default (first cart) straight from data instead of syncing via an effect.
  const [selectedCartIdOverride, setSelectedCartIdOverride] = useState<number | null | undefined>(
    undefined
  );
  const [pending, setPending] = useState(false);

  const selectedCartId =
    selectedCartIdOverride !== undefined ? selectedCartIdOverride : (groups[0]?.cartId ?? null);

  const { subtotal, taxes, fees, visitingCharges, baseFinalAmount, servicesCount, providerId } =
    useMemo(() => {
      const group = groups.find((entry) => entry.cartId === selectedCartId);
      return {
        subtotal: group?.subTotalWithoutTax ?? 0,
        taxes: group?.taxValue ?? 0,
        fees: group?.feesTotal ?? 0,
        visitingCharges: group?.visitingCharges ?? 0,
        baseFinalAmount: group?.overallAmount ?? group?.subTotal ?? 0,
        servicesCount: group?.totalQuantity ?? 0,
        providerId: group?.providerId ?? null,
      };
    }, [groups, selectedCartId]);

  const {
    offers,
    offersStatus,
    appliedPromo,
    promoDiscount,
    promoStatus,
    promoError,
    applyPromo,
    applyPromoCode,
    removePromo,
  } = usePromoCode(providerId, subtotal);

  const finalAmount = Math.max(0, baseFinalAmount - promoDiscount);

  const selectProvider = (cartId: number) => setSelectedCartIdOverride(cartId);

  const runMutation = async (params: Record<string, string | number>) => {
    if (pending) return;
    setPending(true);
    try {
      const isRemoval = "clear_all" in params || "provider_id" in params || ("service_id" in params && !("qty" in params));
      const response = isRemoval
        ? await removeFromCartApi({
            ...params,
            from_new_app: 1,
            ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
          })
        : await manageCartApi({ ...params, from_new_app: 1 });
      if (response?.error) throw new Error(response?.message);
      // remove_from_cart answers with the full remaining cart snapshot (every
      // provider, not just the one touched) — replace outright instead of
      // merging, otherwise a provider that just emptied out survives the
      // merge as a stale "untouched" group. manage_cart only patches the one
      // touched provider's group, so that still needs the merge.
      dispatch(
        setCartData(
          isRemoval
            ? normalizeCartResponse(response?.data)
            : mergeCartData(data, normalizeCartResponse(response?.data))
        )
      );
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("common.cart.error"));
    } finally {
      setPending(false);
    }
  };

  const updateQuantity = (serviceId: number, quantity: number) =>
    runMutation({ service_id: serviceId, qty: quantity });

  const removeService = (serviceId: number) => runMutation({ service_id: serviceId });

  const clearProvider = (providerId: number, cartId: number) => {
    if (!providerId) return;
    if (selectedCartId === cartId) {
      const fallback = groups.find((group) => group.cartId !== cartId);
      setSelectedCartIdOverride(fallback?.cartId ?? null);
    }
    return runMutation({ provider_id: providerId });
  };

  if (status === "loading" && groups.length === 0) {
    return (
      <>
        <PageBreadcrumb title={t("cartPage.title")} items={[{ label: t("cartPage.title") }]} />
        <div className="flex w-full justify-center bg-bg-secondary py-6 lg:py-16">
          <div className="container flex flex-col items-start gap-6 px-4 lg:flex-row lg:px-0">
            <div className="flex w-full flex-1 flex-col items-start gap-6 rounded-2xl border border-border-default bg-bg-primary p-6">
              <Skeleton className="h-6 w-40 rounded" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <Skeleton className="h-64 w-full shrink-0 rounded-2xl bg-bg-tertiary lg:w-96" />
          </div>
        </div>
      </>
    );
  }

  if (groups.length === 0) {
    return (
      <>
        <PageBreadcrumb title={t("cartPage.title")} items={[{ label: t("cartPage.title") }]} />
        <div className="flex min-h-[679px] w-full flex-col items-center justify-center gap-10 bg-bg-primary px-6 py-16 lg:px-36">
          <EmptyCartIllustration className="h-auto w-56 text-icon-brand lg:w-72" />
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-medium text-text-primary lg:text-3xl">
              {t("cartPage.emptyTitle")}
            </h1>
            <p className="text-base text-text-secondary lg:text-xl">{t("cartPage.empty")}</p>
          </div>
          <AppButton variant="primary" size="lg" asChild>
            <Link href="/services">{t("cartPage.browseServices")}</Link>
          </AppButton>
        </div>
      </>
    );
  }

  const totalServicesCount = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <>
      <PageBreadcrumb title={t("cartPage.title")} items={[{ label: t("cartPage.title") }]} />

      <div className="flex w-full justify-center bg-bg-secondary py-6 lg:py-16">
        <div className="container flex flex-col items-start gap-6 lg:flex-row">
          <div className="flex w-full flex-1 flex-col items-start rounded-2xl border border-border-default bg-bg-primary">
            <div className="flex w-full items-center gap-2 border-b border-border-default p-6">
              <span className="flex-1 text-lg text-text-primary">{t("cartPage.yourCart")}</span>
              <span className="text-lg text-text-primary">
                {t("cartPage.servicesCount", { count: totalServicesCount })}
              </span>
            </div>

            <div className="flex w-full flex-col items-start gap-6 p-6">
              {groups.map((group) => (
                <ProviderCartCard
                  key={group.cartId}
                  group={group}
                  selected={selectedCartId === group.cartId}
                  pending={pending}
                  onSelect={() => selectProvider(group.cartId)}
                  onQuantityChange={updateQuantity}
                  onRemoveService={removeService}
                  onClear={() => clearProvider(group.providerId, group.cartId)}
                />
              ))}
            </div>
          </div>

          <OrderSummary
            subtotal={subtotal}
            taxes={taxes}
            fees={fees}
            visitingCharges={visitingCharges}
            finalAmount={finalAmount}
            servicesCount={servicesCount}
            canCheckout={selectedCartId !== null && servicesCount > 0}
            onCheckout={() =>
              router.push(localizePath(`/checkout?cartId=${selectedCartId}`, lang, defaultLocale))
            }
            offers={offers}
            offersStatus={offersStatus}
            appliedPromo={appliedPromo}
            promoDiscount={promoDiscount}
            promoStatus={promoStatus}
            promoError={promoError}
            onApplyPromo={applyPromo}
            onApplyPromoCode={applyPromoCode}
            onRemovePromo={removePromo}
          />
        </div>
      </div>
    </>
  );
}
