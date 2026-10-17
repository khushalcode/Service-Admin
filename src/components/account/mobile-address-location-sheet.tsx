"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { LocationMap, type LatLng } from "@/components/maps/location-map";
import { LocationCrosshairIcon, LocationPinIcon } from "@/components/icons/icons";
import { getPlacesForWebApi, getPlacesDeatilsForWebApi } from "@/api/apiRoutes";
import {
  extractReverseGeocodeResult,
  type PlaceDetailsByIdResponse,
  type PlaceDetailsByLatLngResponse,
  type PlacePrediction,
  type PlacesForWebResponse,
} from "@/lib/places-catalog";
import { getDefaultLatLng } from "@/lib/helpers";
import { useAppSelector } from "@/store/hooks";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Mobile-only full-screen "pick a spot on the map" step, adapted from
 * location-modal.tsx's mobile map step — search + drag-pin + reverse geocode
 * + confirm — but feeding into address creation (AddressFormSheet) instead
 * of the site-wide location. */
export function MobileAddressLocationSheet({
  open,
  onOpenChange,
  initialCenter,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCenter?: LatLng | null;
  onConfirm: (result: { lat: number; lng: number; formattedAddress: string }) => void;
}) {
  const { t } = useTranslation();
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);

  const [mapCenter, setMapCenter] = useState<LatLng>(() =>
    initialCenter ?? getDefaultLatLng(savedLat, savedLng)
  );
  const [resolvedAddress, setResolvedAddress] = useState<{ line: string; lat: number; lng: number } | null>(
    initialCenter ? { line: "", lat: initialCenter.lat, lng: initialCenter.lng } : null
  );
  const [searchDraft, setSearchDraft] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [geoPermission, setGeoPermission] = useState<PermissionState | "unsupported">("prompt");
  const hasAutoLocatedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seeding from the initial center each time the sheet opens
    setMapCenter(initialCenter ?? getDefaultLatLng(savedLat, savedLng));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setResolvedAddress(initialCenter ? { line: "", lat: initialCenter.lat, lng: initialCenter.lng } : null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setSearchDraft("");
    hasAutoLocatedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser capability check, not derivable from props/state
      setGeoPermission("unsupported");
      return;
    }
    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => setGeoPermission(status.state))
      .catch(() => setGeoPermission("unsupported"));
  }, []);

  const reverseGeocode = async (center: LatLng) => {
    setMapCenter(center);
    try {
      const response: PlaceDetailsByLatLngResponse = await getPlacesDeatilsForWebApi({
        latitude: center.lat,
        longitude: center.lng,
      });
      const result = extractReverseGeocodeResult(response);
      if (!result) return;
      setResolvedAddress({ line: result.formatted_address, lat: result.lat, lng: result.lng });
    } catch (error) {
      console.warn("Failed to reverse geocode pin position:", error);
    }
  };

  // Auto-locate once per open when there's no address being edited yet.
  useEffect(() => {
    if (
      !open ||
      initialCenter ||
      hasAutoLocatedRef.current ||
      geoPermission === "denied" ||
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      return;
    }
    hasAutoLocatedRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => reverseGeocode({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => console.warn("Geolocation failed:", error.code, error.message),
      { timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, geoPermission, initialCenter]);

  useEffect(() => {
    let cancelled = false;
    const query = searchDraft.trim();
    const timer = setTimeout(() => {
      if (!query) {
        setPredictions([]);
        setHighlightedIndex(-1);
        return;
      }
      getPlacesForWebApi({ input: query }).then((response: PlacesForWebResponse | null) => {
        if (cancelled) return;
        setPredictions(response?.data?.predictions ?? []);
        setHighlightedIndex(-1);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchDraft]);

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setShowPredictions(false);
    setSearchDraft(prediction.description);
    try {
      const response: PlaceDetailsByIdResponse = await getPlacesDeatilsForWebApi({
        place_id: prediction.place_id,
      });
      const result = response?.data?.result;
      if (!result) return;
      setMapCenter(result.geometry.location);
      setResolvedAddress({
        line: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      });
    } catch (error) {
      console.warn("Failed to resolve place details:", error);
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation || geoPermission === "denied") return;
    navigator.geolocation.getCurrentPosition(
      (position) => reverseGeocode({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => console.warn("Geolocation failed:", error.code, error.message),
      { timeout: 10000 }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary lg:hidden">
      <div className="flex w-full items-center gap-2 bg-bg-primary p-4 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.04)]">
        <AppButton
          variant="link"
          size="lg"
          iconOnly
          leftIcon={(props) => <ArrowLeft {...props} className="size-6 rtl:rotate-180" />}
          aria-label={t("checkoutPage.back")}
          onClick={() => onOpenChange(false)}
          className="rounded-3xl p-2 text-icon-primary"
        >
          {t("checkoutPage.back")}
        </AppButton>
        <span className="flex-1 text-base font-medium text-text-primary">
          {t("account.addresses.form.selectLocationTitle")}
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <LocationMap center={mapCenter} onCenterChange={reverseGeocode} className="absolute inset-0 size-full" />

        <div className="absolute inset-x-4 top-4 z-10 flex items-start gap-2">
          <div className="relative flex-1">
            <div
              className={`flex h-12 items-center gap-2 bg-bg-primary px-4 py-3 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)] ${
                showPredictions && predictions.length > 0 ? "rounded-t-xl" : "rounded-xl"
              }`}
            >
              <Search className="size-5 shrink-0 text-icon-secondary" />
              <input
                type="text"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onFocus={() => setShowPredictions(true)}
                onBlur={() => setTimeout(() => setShowPredictions(false), 150)}
                onKeyDown={(event) => {
                  if (!showPredictions || predictions.length === 0) return;
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setHighlightedIndex((index) => (index + 1) % predictions.length);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setHighlightedIndex((index) => (index - 1 + predictions.length) % predictions.length);
                  } else if (event.key === "Enter" && highlightedIndex >= 0) {
                    event.preventDefault();
                    handleSelectPrediction(predictions[highlightedIndex]);
                  } else if (event.key === "Escape") {
                    setShowPredictions(false);
                  }
                }}
                placeholder={t("account.addresses.form.searchPlaceholder")}
                className="line-clamp-1 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
              />
            </div>

            {showPredictions && predictions.length > 0 && (
              <ul className="absolute top-full left-0 z-10 flex max-h-72 w-full flex-col gap-1 overflow-y-auto rounded-b-xl border-x border-b border-border-default bg-bg-primary p-2 shadow-lg">
                {predictions.map((prediction, index) => (
                  <li key={prediction.place_id}>
                    <AppButton
                      variant="link"
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectPrediction(prediction)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={
                        index === highlightedIndex
                          ? "flex w-full flex-col items-start gap-0.5 rounded-md bg-bg-secondary px-3 py-2 text-start"
                          : "flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-start hover:bg-bg-secondary"
                      }
                    >
                      <span className="text-sm font-medium text-text-primary">
                        {prediction.structured_formatting.main_text}
                      </span>
                      {prediction.structured_formatting.secondary_text && (
                        <span className="text-sm text-text-secondary">
                          {prediction.structured_formatting.secondary_text}
                        </span>
                      )}
                    </AppButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <AppButton
            type="button"
            variant="secondary"
            iconOnly
            leftIcon={LocationCrosshairIcon}
            aria-label={t("account.addresses.form.useCurrentLocation")}
            aria-disabled={geoPermission === "denied"}
            className={`size-12 shrink-0 rounded-2xl bg-bg-primary p-3 text-icon-brand shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)] ${
              geoPermission === "denied" ? "cursor-not-allowed opacity-50" : ""
            }`}
            onClick={handleUseCurrentLocation}
          >
            {t("account.addresses.form.useCurrentLocation")}
          </AppButton>
        </div>

        {resolvedAddress && (
          <div className="absolute inset-x-4 bottom-4 z-10 flex flex-col items-start gap-3 rounded-2xl bg-bg-primary p-3 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
            <div className="flex w-full items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-bg-brand-subtle p-3">
                <LocationPinIcon className="size-6 text-icon-brand" />
              </span>
              <div className="flex flex-1 flex-col items-start gap-1">
                <span className="line-clamp-2 text-sm font-semibold text-text-primary">
                  {resolvedAddress.line || t("account.addresses.form.resolvingLocation")}
                </span>
              </div>
            </div>
            <div className="h-px w-full bg-border-default" />
            <AppButton
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={!resolvedAddress.line}
              onClick={() =>
                onConfirm({ lat: resolvedAddress.lat, lng: resolvedAddress.lng, formattedAddress: resolvedAddress.line })
              }
            >
              {t("account.addresses.form.confirmAddress")}
            </AppButton>
          </div>
        )}
      </div>
    </div>
  );
}
