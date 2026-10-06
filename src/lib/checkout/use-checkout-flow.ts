"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { format, parse } from "date-fns";
import { toast } from "sonner";
import {
  getAddressApi,
  checkAvailableSlotApi,
  releaseSlotLockApi,
  providerCheckAvailabilityApi,
  placeOrderApi,
  addTransactionApi,
  updateOrderStatusApi,
  getCartApi,
  requestAreaCoverageApi,
  type AddressApi,
} from "@/api/apiRoutes";
import type { CartGroup } from "@/lib/cart-types";
import { normalizeCartResponse } from "@/lib/cart-types";
import { setCartData } from "@/store/slices/cart-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  extractErrorMessage,
  type DeliveryAddressType,
  type CheckoutPaymentMethod,
} from "@/lib/checkout/checkout-types";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import { getPendingPayment, clearPendingPayment, setPendingPayment } from "@/lib/checkout/pending-payment";
import { setPaymentInFlight } from "@/lib/checkout/payment-in-flight";
import { getCheckoutDraft, setCheckoutDraft, clearCheckoutDraft } from "@/lib/checkout/checkout-draft";
import { usePromoCode } from "@/lib/checkout/use-promo-code";
import { useRazorpayScript } from "@/lib/checkout/use-razorpay-script";
import { usePaystackScript } from "@/lib/checkout/use-paystack-script";
import { usePaymentGatewaySettings } from "@/lib/checkout/use-payment-gateway-settings";
import { createRazorOrderApi, stripePaymentIntentApi, createCashfreeOrderApi } from "@/api/apiRoutes";

export function useCheckoutFlow(
  cartGroup: CartGroup,
  customJob?: { requestId: number; bidderId: number },
  reorder?: { orderId: number }
) {
  const { t, lang, defaultLocale } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const { loadRazorpay } = useRazorpayScript();
  const { loadPaystack } = usePaystackScript();
  const gatewaySettings = usePaymentGatewaySettings();
  const userEmail = useAppSelector((state) => state.auth.user?.email);

  const [deliveryAddressType, setDeliveryAddressType] = useState<DeliveryAddressType>(
    cartGroup.atDoorstep ? "doorstep" : "store"
  );

  const [addresses, setAddresses] = useState<AddressApi[]>([]);
  const [addressesStatus, setAddressesStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState("");

  const reloadAddresses = () => {
    setAddressesStatus("loading");
    return getAddressApi({})
      .then((response) => {
        if (response?.error) throw new Error(response?.message);
        const list: AddressApi[] = response?.data ?? [];
        setAddresses(list);
        setSelectedAddressId((current) => {
          if (current && list.some((address) => address.id === current)) return current;
          const defaultAddress = list.find((address) => address.is_default === "1") ?? list[0];
          return defaultAddress ? defaultAddress.id : null;
        });
        setAddressesStatus("loaded");
      })
      .catch((error) => {
        setAddressesStatus("error");
        toast.error(extractErrorMessage(error, t("checkoutPage.errors.addressLoadFailed")));
      });
  };

  useEffect(() => {
    if (deliveryAddressType !== "doorstep" || addressesStatus !== "idle") return;
    reloadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadAddresses is stable-enough per render; re-running on its identity would refetch every render
  }, [deliveryAddressType, addressesStatus]);

  const subtotal = cartGroup.subTotalWithoutTax ?? 0;

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
  } = usePromoCode(cartGroup.providerId, subtotal);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slotMessage, setSlotMessage] = useState<string | null>(null);
  const [slotLockId, setSlotLockId] = useState<string | null>(null);
  const [slotLockStatus, setSlotLockStatus] = useState<"idle" | "locking" | "locked" | "error">("idle");
  const [slotLockError, setSlotLockError] = useState<string | null>(null);

  const releaseHeldSlot = (lockId: string) => {
    releaseSlotLockApi({ lock_id: lockId }).catch(() => {
      // best-effort — the lock will also expire server-side on its own TTL
    });
  };

  // `message` is the multi-day-continuation note the backend attaches to a
  // slot (e.g. the job runs past midnight into the next day) — surfaced by
  // the picker at selection time, not something this hook derives itself.
  const confirmSlot = async (date: Date, time: string, message: string | null = null): Promise<boolean> => {
    setSlotLockStatus("locking");
    setSlotLockError(null);
    const previousLockId = slotLockId;
    try {
      const dateOfService = format(date, "yyyy-MM-dd");
      const time24 = format(parse(time, "hh:mm a", new Date()), "HH:mm");
      const response = await checkAvailableSlotApi({
        partner_id: cartGroup.providerId,
        date: dateOfService,
        time: time24,
        // Backend resolves the in-progress cart from these when there's no
        // real cart row to look up (custom-job bid, or reorder) — without
        // them it falls back to "please add some service in cart".
        ...(customJob ? { custom_job_request_id: customJob.requestId } : {}),
        ...(reorder ? { order_id: reorder.orderId } : {}),
      });
      if (response?.error) throw new Error(response?.message);
      if (previousLockId) releaseHeldSlot(previousLockId);
      setSlotLockId(response?.data?.lock_id ?? null);
      setSelectedDate(date);
      setSelectedTime(time);
      setSlotMessage(message);
      setSlotLockStatus("locked");
      setCheckoutDraft(cartGroup.cartId, date.toISOString(), time);
      return true;
    } catch (error) {
      setSlotLockStatus("error");
      setSlotLockError(extractErrorMessage(error, t("checkoutPage.errors.slotUnavailable")));
      return false;
    }
  };

  useEffect(() => {
    return () => {
      if (slotLockId) releaseHeldSlot(slotLockId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup must see the latest lock id on unmount only, not resubscribe every render
  }, []);

  useEffect(() => {
    const pending = getPendingPayment();
    if (!pending) return;
    // Marking the transaction "failed" alone doesn't release the slot the
    // abandoned order reserved — cancel the order too, or a retry with a
    // different method hits "slot full" against your own dead order.
    Promise.all([
      addTransactionApi({ order_id: pending.orderId, status: "failed" }),
      updateOrderStatusApi({ order_id: pending.orderId, status: "cancelled" }),
    ]).finally(() => {
      clearPendingPayment();
    });
  }, []);

  useEffect(() => {
    const draft = getCheckoutDraft(cartGroup.cartId);
    if (!draft) return;
    confirmSlot(new Date(draft.date), draft.time);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot restore on mount for this cart only, not tied to confirmSlot identity
  }, [cartGroup.cartId]);

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;

  const [providerAvailabilityStatus, setProviderAvailabilityStatus] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");
  const [providerDistanceKm, setProviderDistanceKm] = useState<number | null>(null);
  const [areaRequestStatus, setAreaRequestStatus] = useState<"idle" | "submitting" | "submitted">("idle");

  useEffect(() => {
    setAreaRequestStatus("idle");

    if (deliveryAddressType !== "doorstep" || !selectedAddress) {
      setProviderAvailabilityStatus("idle");
      setProviderDistanceKm(null);
      return;
    }

    let cancelled = false;
    setProviderAvailabilityStatus("checking");
    providerCheckAvailabilityApi({
      provider_id: cartGroup.providerId,
      latitude: Number(selectedAddress.lattitude),
      longitude: Number(selectedAddress.longitude),
      is_checkout_process: 1,
      // Same seam as confirmSlot's check_available_slot call — the backend
      // resolves the in-progress cart from these when there's no real cart
      // row (custom-job bid, or reorder).
      ...(customJob ? { custom_job_request_id: customJob.requestId, bidder_id: customJob.bidderId } : {}),
      ...(reorder ? { order_id: reorder.orderId } : {}),
    })
      .then((response) => {
        if (cancelled) return;
        const match = (response?.data ?? []).find(
          (item: { id: string }) => item.id === String(cartGroup.providerId)
        );
        if (!match) {
          setProviderAvailabilityStatus("unavailable");
          setProviderDistanceKm(null);
          return;
        }
        setProviderAvailabilityStatus("available");
        const distance = Number(match.distance);
        setProviderDistanceKm(Number.isFinite(distance) ? distance : null);
      })
      .catch(() => {
        if (cancelled) return;
        setProviderAvailabilityStatus("unavailable");
        setProviderDistanceKm(null);
      });

    return () => {
      cancelled = true;
    };
  }, [deliveryAddressType, selectedAddress, cartGroup.providerId]);

  const requestAreaCoverage = async () => {
    if (!selectedAddress) return;
    setAreaRequestStatus("submitting");
    try {
      const response = await requestAreaCoverageApi({
        latitude: Number(selectedAddress.lattitude),
        longitude: Number(selectedAddress.longitude),
        address: selectedAddress.address,
      });
      if (response?.error) throw new Error(response?.message);
      setAreaRequestStatus("submitted");
    } catch (error) {
      setAreaRequestStatus("idle");
      toast.error(extractErrorMessage(error, t("checkoutPage.errors.orderFailed")));
    }
  };

  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod | null>(
    cartGroup.isPayLaterAllowed ? "cod" : null
  );

  const finalAmount = Math.max(0, (cartGroup.overallAmount ?? cartGroup.subTotal) - promoDiscount);

  const canCheckout =
    paymentMethod !== null &&
    slotLockStatus === "locked" &&
    (deliveryAddressType === "store" ||
      (deliveryAddressType === "doorstep" &&
        Boolean(selectedAddressId) &&
        providerAvailabilityStatus === "available"));

  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  const [stripeModal, setStripeModal] = useState<{
    open: boolean;
    clientSecret: string | null;
    orderId: string | number | null;
  }>({
    open: false,
    clientSecret: null,
    orderId: null,
  });

  const buildOrderPayload = (method: CheckoutPaymentMethod) => {
    clearCheckoutDraft(cartGroup.cartId);
    return {
    ...(customJob
      ? { custom_job_request_id: customJob.requestId, bidder_id: customJob.bidderId }
      : reorder
        ? { order_id: reorder.orderId }
        : { cart_id: cartGroup.cartId }),
    payment_method: method,
    status: "awaiting",
    date_of_service: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
    starting_time: selectedTime ? format(parse(selectedTime, "hh:mm a", new Date()), "HH:mm") : undefined,
    at_store: deliveryAddressType === "store" ? 1 : 0,
    ...(deliveryAddressType === "doorstep" && selectedAddressId
      ? { address_id: selectedAddressId }
      : {}),
    ...(deliveryNote ? { order_note: deliveryNote } : {}),
    ...(appliedPromo ? { promo_code_id: appliedPromo.id } : {}),
    };
  };

  const refreshCart = async () => {
    const refreshedCart = await getCartApi({
      from_new_app: 1,
      ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
    });
    if (!refreshedCart?.error) {
      dispatch(setCartData(normalizeCartResponse(refreshedCart?.data)));
    }
  };

  const handleCodPayment = async () => {
    const order = await placeOrderApi(buildOrderPayload("cod"));
    if (order?.error) throw new Error(order?.message);
    const orderId = order?.data?.order_id;

    const transaction = await addTransactionApi({
      order_id: orderId,
      type: "cod",
      status: "success",
      ...(reorder ? { is_reorder: "1" } : {}),
    });
    if (transaction?.error) throw new Error(transaction?.message);

    router.push(localizePath(`/booking/${orderId}`, lang, defaultLocale));
    // Awaited so the cart-refresh dispatch (which drops this now-converted
    // cart from redux) lands before handleCheckout's finally clears
    // paymentInFlight — otherwise checkout-view's "cart missing -> redirect
    // to /cart" guard can win a race against this router.push while the
    // /booking navigation is still in flight.
    await refreshCart();
  };

  const handleRedirectPayment = async (method: CheckoutPaymentMethod, redirectUrlKey: string) => {
    const order = await placeOrderApi(buildOrderPayload(method));
    if (order?.error) throw new Error(order?.message);
    const orderId = order?.data?.order_id;
    const redirectUrl = order?.data?.[redirectUrlKey];
    if (!redirectUrl) throw new Error(t("checkoutPage.errors.gatewayUrlMissing"));

    setPendingPayment(orderId, method);
    window.location.href = redirectUrl;
  };

  const handleXenditPayment = () => handleRedirectPayment("xendit", "xendit");
  const handlePaypalPayment = () => handleRedirectPayment("paypal", "paypal_link");
  const handleFlutterwavePayment = () => handleRedirectPayment("flutterwave", "flutterwave");

  const handlePaystackPayment = async () => {
    if (!userEmail) {
      throw new Error(t("checkoutPage.errors.paystackEmailRequired"));
    }
    const scriptLoaded = await loadPaystack();
    if (!scriptLoaded || !window.PaystackPop) {
      throw new Error(t("checkoutPage.errors.orderFailed"));
    }

    const order = await placeOrderApi(buildOrderPayload("paystack"));
    if (order?.error) throw new Error(order?.message);
    const orderId = order?.data?.order_id;

    return new Promise<void>((resolve) => {
      // Guard against onSuccess/onCancel both firing for the same transaction
      // (same class of race as Razorpay's modal.ondismiss) so a completed
      // payment can't be overwritten by a stray "failed" call.
      let settled = false;

      new window.PaystackPop!().newTransaction({
        key: gatewaySettings.paystack_key ?? "",
        email: userEmail,
        amount: Math.round(finalAmount * 100),
        currency: gatewaySettings.paystack_currency,
        ref: `order_${orderId}_${Date.now()}`,
        metadata: { order_id: orderId },
        onSuccess: async () => {
          settled = true;
          const transaction = await addTransactionApi({
            order_id: orderId,
            status: "success",
            ...(reorder ? { is_reorder: "1" } : {}),
          });
          if (transaction?.error) {
            toast.error(extractErrorMessage(new Error(transaction?.message), t("checkoutPage.errors.orderFailed")));
            resolve();
            return;
          }
          // Awaited so this navigation actually lands before handleCheckout's
          // finally clears paymentInFlight — otherwise checkout-view's
          // "cart missing -> redirect to /cart" guard (which reacts to the
          // cart-refresh dispatch below) can win the race and override this
          // push while it's still in flight.
          await router.push(
            localizePath("/payment-status", lang, defaultLocale) +
              `?order_id=${orderId}&status=successful&method=paystack`
          );
          await refreshCart();
          resolve();
        },
        onCancel: async () => {
          if (settled) return;
          await addTransactionApi({
            order_id: orderId,
            status: "failed",
            ...(reorder ? { is_reorder: "1" } : {}),
          });
          await router.push(
            localizePath("/payment-status", lang, defaultLocale) +
              `?order_id=${orderId}&status=failed&method=paystack`
          );
          resolve();
        },
      });
    });
  };

  const handleRazorpayPayment = async () => {
    const scriptLoaded = await loadRazorpay();
    if (!scriptLoaded || !window.Razorpay) {
      throw new Error(t("checkoutPage.errors.orderFailed"));
    }

    const order = await placeOrderApi(buildOrderPayload("razorpay"));
    if (order?.error) throw new Error(order?.message);
    const orderId = order?.data?.order_id;

    const razorOrder = await createRazorOrderApi({ order_id: orderId });
    if (razorOrder?.error) throw new Error(razorOrder?.message);

    return new Promise<void>((resolve) => {
      // Razorpay's checkout modal auto-closes right after a successful payment,
      // which also fires `modal.ondismiss` — without this guard the "failed"
      // transaction call can land after the "success" one and cancel an
      // already-paid order.
      let settled = false;

      const options = {
        key: gatewaySettings.razorpay_key,
        amount: razorOrder?.data?.amount,
        currency: gatewaySettings.razorpay_currency,
        order_id: razorOrder?.data?.id,
        notes: { order_id: orderId },
        handler: async (response: { razorpay_payment_id?: string }) => {
          if (!response.razorpay_payment_id) {
            resolve();
            return;
          }
          settled = true;
          const transaction = await addTransactionApi({
            order_id: orderId,
            status: "success",
            ...(reorder ? { is_reorder: "1" } : {}),
          });
          if (transaction?.error) {
            toast.error(extractErrorMessage(new Error(transaction?.message), t("checkoutPage.errors.orderFailed")));
            resolve();
            return;
          }
          // Awaited so this navigation actually lands before handleCheckout's
          // finally clears paymentInFlight — otherwise checkout-view's
          // "cart missing -> redirect to /cart" guard (which reacts to the
          // cart-refresh dispatch below) can win the race and override this
          // push while it's still in flight.
          await router.push(
            localizePath("/payment-status", lang, defaultLocale) +
              `?order_id=${orderId}&status=successful&method=razorpay`
          );
          await refreshCart();
          resolve();
        },
        modal: {
          ondismiss: async () => {
            if (settled) return;
            await addTransactionApi({
              order_id: orderId,
              status: "failed",
              ...(reorder ? { is_reorder: "1" } : {}),
            });
            await router.push(
              localizePath("/payment-status", lang, defaultLocale) +
                `?order_id=${orderId}&status=failed&method=razorpay`
            );
            resolve();
          },
        },
      };
      new window.Razorpay!(options).open();
    });
  };

  const handleStripePayment = async () => {
    const order = await placeOrderApi(buildOrderPayload("stripe"));
    if (order?.error) throw new Error(order?.message);
    const orderId = order?.data?.order_id;

    const intent = await stripePaymentIntentApi({ order_id: orderId });
    if (intent?.error) throw new Error(intent?.message);

    setStripeModal({ open: true, clientSecret: intent?.data?.client_secret ?? null, orderId });
  };

  const handleStripeModalClose = async () => {
    if (stripeModal.orderId) {
      await addTransactionApi({
        order_id: stripeModal.orderId,
        status: "failed",
        ...(reorder ? { is_reorder: "1" } : {}),
      });
    }
    setStripeModal({ open: false, clientSecret: null, orderId: null });
    setIsProcessingCheckout(false);
    setPaymentInFlight(false);
  };

  const handleStripeModalSuccess = async () => {
    if (!stripeModal.orderId) return;
    const transaction = await addTransactionApi({
      order_id: stripeModal.orderId,
      status: "success",
      ...(reorder ? { is_reorder: "1" } : {}),
    });
    const orderId = stripeModal.orderId;
    setStripeModal({ open: false, clientSecret: null, orderId: null });
    if (transaction?.error) {
      toast.error(extractErrorMessage(new Error(transaction?.message), t("checkoutPage.errors.orderFailed")));
      setIsProcessingCheckout(false);
      setPaymentInFlight(false);
      return;
    }
    // Awaited so this navigation actually lands before paymentInFlight
    // clears — otherwise checkout-view's "cart missing -> redirect to
    // /cart" guard (which reacts to the cart-refresh dispatch below) can
    // win the race and override this push while it's still in flight.
    await router.push(
      localizePath("/payment-status", lang, defaultLocale) + `?order_id=${orderId}&status=successful&method=stripe`
    );
    await refreshCart();
    setPaymentInFlight(false);
  };

  const handleStripeModalFailure = async () => {
    if (!stripeModal.orderId) return;
    const orderId = stripeModal.orderId;
    await addTransactionApi({
      order_id: orderId,
      status: "failed",
      ...(reorder ? { is_reorder: "1" } : {}),
    });
    setStripeModal({ open: false, clientSecret: null, orderId: null });
    setIsProcessingCheckout(false);
    await router.push(
      localizePath("/payment-status", lang, defaultLocale) + `?order_id=${orderId}&status=failed&method=stripe`
    );
    setPaymentInFlight(false);
  };

  const handleCashfreePayment = async () => {
    const order = await placeOrderApi(buildOrderPayload("cashfree"));
    if (order?.error) throw new Error(order?.message);
    const orderId = order?.data?.order_id;

    const cashfreeOrder = await createCashfreeOrderApi({ order_id: orderId });
    if (cashfreeOrder?.error) throw new Error(cashfreeOrder?.message);
    const sessionId = cashfreeOrder?.data?.payment_session_id;
    if (!sessionId) throw new Error(t("checkoutPage.errors.gatewayUrlMissing"));

    const { load } = await import("@cashfreepayments/cashfree-js");
    const cashfree = await load({ mode: gatewaySettings.cashfree_mode === "production" ? "production" : "sandbox" });

    setPendingPayment(orderId, "cashfree");
    cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_self" });
  };

  const handleCheckout = async () => {
    if (!canCheckout || isProcessingCheckout) return;
    setIsProcessingCheckout(true);
    setPaymentInFlight(true);
    try {
      if (paymentMethod === "cod") {
        await handleCodPayment();
      } else if (paymentMethod === "stripe") {
        await handleStripePayment();
      } else if (paymentMethod === "razorpay") {
        await handleRazorpayPayment();
      } else if (paymentMethod === "cashfree") {
        await handleCashfreePayment();
      } else if (paymentMethod === "xendit") {
        await handleXenditPayment();
      } else if (paymentMethod === "paypal") {
        await handlePaypalPayment();
      } else if (paymentMethod === "flutterwave") {
        await handleFlutterwavePayment();
      } else if (paymentMethod === "paystack") {
        await handlePaystackPayment();
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, t("checkoutPage.errors.orderFailed")));
      setPaymentInFlight(false);
    } finally {
      setIsProcessingCheckout(false);
      // Stripe leaves its modal open past this point (handleStripePayment
      // returns as soon as the modal is shown) — the modal's own
      // close/success/failure handlers clear paymentInFlight instead.
      if (paymentMethod !== "stripe") setPaymentInFlight(false);
    }
  };

  return {
    deliveryAddressType,
    setDeliveryAddressType,
    addresses,
    addressesStatus,
    selectedAddressId,
    selectedAddress,
    selectAddress: setSelectedAddressId,
    reloadAddresses,
    deliveryNote,
    setDeliveryNote,
    providerAvailabilityStatus,
    providerDistanceKm,
    areaRequestStatus,
    requestAreaCoverage,
    selectedDate,
    selectedTime,
    slotMessage,
    slotLockStatus,
    slotLockError,
    confirmSlot,
    paymentMethod,
    setPaymentMethod,
    canCheckout,
    isProcessingCheckout,
    handleCheckout,
    finalAmount,
    stripeModal,
    handleStripeModalClose,
    handleStripeModalSuccess,
    handleStripeModalFailure,
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
