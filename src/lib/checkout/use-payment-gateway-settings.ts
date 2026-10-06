"use client";

import { useEffect } from "react";
import { getSettingsApi } from "@/api/apiRoutes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSettings } from "@/store/slices/settings-slice";
import type { PaymentGatewaySettings } from "@/lib/checkout/checkout-types";

// get_settings only includes payment_gateways_settings for an authenticated
// request. AppBootstrap's own fetch can land before login (guest browsing,
// or a race with auth rehydration) and nothing there re-fetches afterward —
// so checkout, the one place this data actually matters, refreshes it itself
// on mount instead of trusting whatever AppBootstrap already cached.
let gatewaySettingsFetchInFlight = false;

export function usePaymentGatewaySettings(): PaymentGatewaySettings {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (gatewaySettingsFetchInFlight) return;
    gatewaySettingsFetchInFlight = true;
    getSettingsApi()
      .then((response) => {
        if (response?.data) dispatch(setSettings(response.data));
      })
      .finally(() => {
        gatewaySettingsFetchInFlight = false;
      });
  }, [dispatch]);

  return useAppSelector(
    (state) =>
      (state.settings.data?.payment_gateways_settings as PaymentGatewaySettings | undefined) ?? {}
  );
}
