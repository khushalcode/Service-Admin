import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";

interface GeneralSettings {
  currency?: string;
  decimal_point?: string;
  country_currency_code?: string;
}

function formatPrice(
  price: number | string | null | undefined,
  generalSettings: GeneralSettings | undefined
): string {
  if (price === null || price === undefined || price === "" || price === "null") {
    return price as string;
  }

  const currencyCode = generalSettings?.country_currency_code || "USD";
  const currencySymbol = generalSettings?.currency || "$";
  const decimalPoints = generalSettings?.decimal_point;

  let decimalDigits = parseInt(decimalPoints ?? "", 10);
  if (isNaN(decimalDigits) || decimalDigits < 0 || decimalDigits > 20) {
    decimalDigits = 2;
  }

  const numericPrice = parseFloat(price.toString().replace(/,/g, ""));
  if (isNaN(numericPrice)) {
    return `${currencySymbol}${(0).toFixed(decimalDigits)}`;
  }

  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";

  try {
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      throw new Error("Invalid currency code format");
    }

    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
    });
    const formattedNumber = formatter.format(numericPrice);

    const currencyFormatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "symbol",
    });
    const sampleFormatted = currencyFormatter.format(1);
    const isSymbolPrefix = /^[^\d]/.test(sampleFormatted);

    return isSymbolPrefix
      ? `${currencySymbol}${formattedNumber}`
      : `${formattedNumber} ${currencySymbol}`;
  } catch {
    const numberFormatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
    });
    const formattedNumber = numberFormatter.format(numericPrice);
    return `${currencySymbol}${formattedNumber}`;
  }
}

/**
 * Formats a price using currency symbol, currency code, and decimal point
 * from general_settings (Redux). The settings slice is persisted to
 * localStorage, so it's readable before the client has hydrated — reading
 * it unconditionally would make the first client render disagree with the
 * settings-less SSR markup. Guard with useHasHydrated so the first client
 * render matches SSR exactly, then the real formatting swaps in a tick later.
 */
export function useShowPrice(price: number | string | null | undefined): string {
  const hasHydrated = useHasHydrated();
  const generalSettings = useAppSelector(
    (state) => state.settings.data?.general_settings as GeneralSettings | undefined
  );

  return formatPrice(price, hasHydrated ? generalSettings : undefined);
}

/**
 * Just the currency symbol from general_settings (e.g. "$", "₹") — for
 * inline prefixes on price inputs, not a fully formatted amount. Same
 * hydration guard as useShowPrice.
 */
export function useCurrencySymbol(): string {
  const hasHydrated = useHasHydrated();
  const generalSettings = useAppSelector(
    (state) => state.settings.data?.general_settings as GeneralSettings | undefined
  );
  return hasHydrated ? (generalSettings?.currency ?? "$") : "$";
}

/**
 * Same as useShowPrice but returns a formatter function instead of a single
 * formatted value — for lists (e.g. cart items in a .map()) where calling a
 * hook once per item would violate the rules of hooks.
 */
export function usePriceFormatter(): (price: number | string | null | undefined) => string {
  const hasHydrated = useHasHydrated();
  const generalSettings = useAppSelector(
    (state) => state.settings.data?.general_settings as GeneralSettings | undefined
  );

  return (price) => formatPrice(price, hasHydrated ? generalSettings : undefined);
}
