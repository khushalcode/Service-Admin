"use client";

import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { ArrowLeft, Check, History, Pencil, Phone, Search, X } from "lucide-react";
import {
  AddressHomeIcon,
  AddressOfficeIcon,
  AddressOtherIcon,
  CurrentLocationIcon,
  LocationCrosshairIcon,
  LocationPinIcon,
  ServiceUnavailableIllustration,
} from "@/components/icons/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AppButton } from "@/components/ui/app-button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLocation } from "@/store/slices/location-slice";
import { LocationMap, type LatLng } from "@/components/maps/location-map";
import {
  getAddressApi,
  getPlacesForWebApi,
  getPlacesDeatilsForWebApi,
  normalizeAddressType,
  providerCheckAvailabilityApi,
  requestAreaCoverageApi,
  type AddressApi,
} from "@/api/apiRoutes";
import {
  extractReverseGeocodeResult,
  type PlaceDetailsByIdResponse,
  type PlaceDetailsByLatLngResponse,
  type PlacePrediction,
  type PlacesForWebResponse,
  type RequestAreaCoverageResponse,
} from "@/lib/places-catalog";
import { getDefaultLatLng, splitAddressLine } from "@/lib/helpers";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { useRecentLocationSearches } from "@/lib/use-recent-location-searches";
import type { ProviderAvailabilityResponse } from "@/lib/providers-catalog";

interface SavedAddress {
  id: string;
  label: "Home" | "Office" | "Other";
  line: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  mobile?: string;
}

export function LocationModal({
  open,
  onOpenChange,
  required = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // When true, the user must pick a location before the modal can close —
  // no X button, no escape/outside-click dismiss. Used to gate pages like
  // /services and /providers that need a location to fetch anything.
  required?: boolean;
}) {
  const dispatch = useAppDispatch();
  useScrollLock(open);
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentLocationSearches();
  const current = useAppSelector((state) => state.location.current);
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);
  const isLoggedIn = Boolean(useAppSelector((state) => state.auth.token));
  // A pin-drop or search pick — never persisted, never shown under Saved
  // Addresses. It only becomes a real address if the user saves it from the
  // Addresses page. Selecting it here just points the map/update button at it.
  const [pickedAddress, setPickedAddress] = useState<SavedAddress | null>(null);
  const [fetchedAddresses, setFetchedAddresses] = useState<SavedAddress[]>([]);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [mapCenter, setMapCenter] = useState<LatLng>(() => getDefaultLatLng(null, null));
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [geoPermission, setGeoPermission] = useState<PermissionState | "unsupported">("prompt");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<"idle" | "unavailable">("idle");
  const [submittingAreaRequest, setSubmittingAreaRequest] = useState(false);
  const [areaRequestSubmitted, setAreaRequestSubmitted] = useState(false);
  // Mobile only: "list" is the search/saved-addresses screen (no map yet);
  // picking a prediction/saved address/current location moves to "map" —
  // the pin-drop + confirm screen. Desktop shows both panels side by side,
  // so this doesn't apply there.
  const [mobileStep, setMobileStep] = useState<"list" | "map">("list");

  // Track the browser's actual geolocation permission (not just our own guess) so we
  // never re-trigger the native prompt once the user has granted or blocked it, and
  // can reflect a "blocked" state in the UI instead of silently failing on every click.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser capability check, not derivable from props/state
      setGeoPermission("unsupported");
      return;
    }
    let permissionStatus: PermissionStatus | null = null;
    const handleChange = () => {
      if (permissionStatus) setGeoPermission(permissionStatus.state);
    };
    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        permissionStatus = status;
        setGeoPermission(status.state);
        status.addEventListener("change", handleChange);
      })
      .catch(() => setGeoPermission("unsupported"));
    return () => permissionStatus?.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!open || !isLoggedIn) return;
    let cancelled = false;
    getAddressApi().then((response) => {
      if (cancelled) return;
      const list: AddressApi[] = response?.data ?? [];
      setFetchedAddresses(
        list.map((addressItem) => {
          const type = normalizeAddressType(addressItem.type);
          return {
            id: `api-${addressItem.id}`,
            label: (type.charAt(0).toUpperCase() + type.slice(1)) as SavedAddress["label"],
            line: addressItem.address,
            lat: Number.parseFloat(addressItem.lattitude),
            lng: Number.parseFloat(addressItem.longitude),
            isDefault: addressItem.is_default === "1",
            mobile: addressItem.mobile,
          };
        })
      );
    });
    return () => {
      cancelled = true;
    };
  }, [open, isLoggedIn]);

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

  const savedAddresses = fetchedAddresses;
  const isChangeFlow = Boolean(current) || savedAddresses.length > 0;
  const selectedAddress = pickedAddress ?? savedAddresses.find((a) => a.id === selectedAddressId);
  const requestedLocationLines = selectedAddress
    ? splitAddressLine(selectedAddress.line)
    : null;

  const selectResolvedAddress = (line: string, coords: LatLng) => {
    setSelectedAddressId(null);
    setPickedAddress({
      id: `picked-${crypto.randomUUID()}`,
      label: "Other",
      line,
      lat: coords.lat,
      lng: coords.lng,
      isDefault: false,
    });
  };

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
      selectResolvedAddress(result.formatted_address, result.geometry.location);
      addRecentSearch({
        line: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      });
      setMobileStep("map");
    } catch (error) {
      console.warn("Failed to resolve place details:", error);
    }
  };

  const handleMapPinMove = async (center: LatLng, options?: { advanceMobileStep?: boolean }) => {
    setMapCenter(center);
    try {
      const response: PlaceDetailsByLatLngResponse = await getPlacesDeatilsForWebApi({
        latitude: center.lat,
        longitude: center.lng,
      });
      const result = extractReverseGeocodeResult(response);
      if (!result) return;

      selectResolvedAddress(result.formatted_address, { lat: result.lat, lng: result.lng });
      if (options?.advanceMobileStep ?? true) setMobileStep("map");
    } catch (error) {
      console.warn("Failed to reverse geocode pin position:", error);
    }
  };

  // Re-baseline the map to the user's saved location (or Bhuj if none saved) every time the
  // modal opens, and resolve + select it immediately (same as a manual drag) — the pin you
  // see on open must already be a usable selection, not just a marker sitting there until
  // you drag it once to trigger the same reverse-geocode.
  useEffect(() => {
    if (!open) return;
    handleMapPinMove(getDefaultLatLng(savedLat, savedLng), { advanceMobileStep: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleMapPinMove is stable enough per-render; re-running is intentional only on open/saved-location change
  }, [open, savedLat, savedLng]);

  // Only auto-locate the first time the modal opens per page load — re-calling
  // getCurrentPosition on every reopen re-triggers the browser's native permission
  // prompt in Firefox unless the user checked "Remember this decision" there.
  const hasAutoLocatedRef = useRef(false);

  useEffect(() => {
    if (
      !open ||
      hasAutoLocatedRef.current ||
      geoPermission === "denied" ||
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      return;
    }
    hasAutoLocatedRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Overrides the baseline above with the real GPS fix once it resolves.
        handleMapPinMove(
          { lat: position.coords.latitude, lng: position.coords.longitude },
          { advanceMobileStep: false }
        );
      },
      (error) => {
        console.warn("Geolocation failed:", error.code, error.message);
      },
      { timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleMapPinMove is stable enough per-render; ref guard prevents re-running
  }, [open, geoPermission]);

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.warn("Geolocation not available in this browser");
      return;
    }
    if (geoPermission === "denied") return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleMapPinMove({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Geolocation failed:", error.code, error.message);
      },
      { timeout: 10000 }
    );
  };

  const handleUpdateLocation = async () => {
    if (!selectedAddress) return;
    setCheckingAvailability(true);
    try {
      const response: ProviderAvailabilityResponse = await providerCheckAvailabilityApi({
        latitude: selectedAddress.lat,
        longitude: selectedAddress.lng,
        is_checkout_process: 0,
      }); 
      if ((response?.data?.length ?? 0) === 0) {
        setAvailabilityStatus("unavailable");
        return;
      }
    } catch (error) {
      // Backend responds with an HTTP 404 (not a 200 + empty array) when no
      // providers cover this location, so axios throws — that's the same
      // "unavailable" outcome as an empty data[], not a real failure.
      if (isAxiosError(error) && error.response?.status === 404) {
        setAvailabilityStatus("unavailable");
        return;
      }
      // Fail open for genuine errors (network hiccup, 5xx, etc.) — don't block
      // saving the location just because the availability check itself broke.
      console.warn("Failed to check provider availability:", error);
    } finally {
      setCheckingAvailability(false);
    }

    dispatch(
      setLocation({
        address: selectedAddress.line,
        lat: selectedAddress.lat,
        lng: selectedAddress.lng,
      })
    );
    handleClose(false);
  };

  const handleRequestAreaCoverage = async () => {
    if (!selectedAddress) return;
    setSubmittingAreaRequest(true);
    try {
      const response: RequestAreaCoverageResponse | null = await requestAreaCoverageApi({
        latitude: selectedAddress.lat,
        longitude: selectedAddress.lng,
        address: selectedAddress.line,
      });
      if (response && !response.error) {
        setAreaRequestSubmitted(true);
      }
    } catch (error) {
      console.warn("Failed to submit area coverage request:", error);
    } finally {
      setSubmittingAreaRequest(false);
    }
  };

  const handleClose = (next: boolean) => {
    // A required modal only ever closes because a location was just saved
    // (which flips the parent's `open` prop via redux, not via this callback)
    // — ignore escape/outside-click/close-button dismiss attempts here.
    if (required && !next) return;
    if (!next) {
      setSelectedAddressId(null);
      setPickedAddress(null);
      setSearchDraft("");
      setPredictions([]);
      setAvailabilityStatus("idle");
      setAreaRequestSubmitted(false);
      setMobileStep("list");
    }
    onOpenChange(next);
  };

  return (
    <>
    <Dialog open={open && !areaRequestSubmitted} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (required) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (required) event.preventDefault();
        }}
        className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-border-default bg-bg-primary p-0 lg:max-w-[1200px] max-lg:fixed max-lg:inset-0 max-lg:top-0 max-lg:start-0 max-lg:h-dvh max-lg:max-h-none max-lg:w-screen max-lg:max-w-none max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-none max-lg:border-0"
      >
        {/* Mobile — floating header bar over the full-screen map instead of a bordered bar. */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 bg-bg-primary px-4 py-2 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.04)] lg:hidden">
          {(!required || mobileStep === "map" || availabilityStatus === "unavailable") && (
            <AppButton
              variant="link"
              size="lg"
              iconOnly
              leftIcon={(props) => <ArrowLeft {...props} className="size-6 rtl:rotate-180" />}
              aria-label="Back"
              onClick={() => {
                if (availabilityStatus === "unavailable") {
                  setAvailabilityStatus("idle");
                } else if (mobileStep === "map") {
                  setMobileStep("list");
                  setSelectedAddressId(null);
                  setPickedAddress(null);
                } else {
                  handleClose(false);
                }
              }}
              className="rounded-3xl p-2 text-icon-primary"
            >
              Back
            </AppButton>
          )}
          <span className="flex-1 text-base font-medium text-text-primary">
            {availabilityStatus === "unavailable"
              ? "Set Location"
              : mobileStep === "map"
                ? isChangeFlow
                  ? "Change Location"
                  : "Add Location"
                : "Select Location"}
          </span>
        </div>

        <DialogHeader className="hidden flex-row shrink-0 items-center gap-6 border-b border-border-default px-4 py-4 lg:flex lg:px-6">
          <DialogTitle className="flex-1 text-start text-lg font-medium text-text-primary">
            {availabilityStatus === "unavailable"
              ? "Select Location"
              : isChangeFlow
                ? "Change Location"
                : "Add Location"}
          </DialogTitle>
          {!required && (
            <AppButton
              variant="secondary-outline"
              size="lg"
              iconOnly
              leftIcon={X}
              aria-label="Close"
              onClick={() => handleClose(false)}
              className="rounded-lg border-border-default bg-bg-secondary p-2"
            >
              Close
            </AppButton>
          )}
        </DialogHeader>

        {/* Mobile step 1 — search + saved addresses, no map yet. Picking a
            result (search/current-location/saved address) moves to step 2. */}
        {mobileStep === "list" && availabilityStatus !== "unavailable" && (
          <div className="flex min-h-0 flex-1 flex-col items-center gap-6 overflow-y-auto bg-bg-secondary px-4 pt-[4.5rem] pb-6 lg:hidden">
            <div className="flex w-full items-start gap-2">
              <div className="relative flex-1">
                <div
                  className={`flex h-14 items-center gap-2 bg-bg-primary p-4 ${showPredictions && predictions.length > 0 ? "rounded-t-xl" : "rounded-xl"}`}
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
                        setHighlightedIndex(
                          (index) => (index - 1 + predictions.length) % predictions.length
                        );
                      } else if (event.key === "Enter") {
                        if (highlightedIndex >= 0) {
                          event.preventDefault();
                          handleSelectPrediction(predictions[highlightedIndex]);
                        }
                      } else if (event.key === "Escape") {
                        setShowPredictions(false);
                      }
                    }}
                    placeholder="Search City or Location"
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
                aria-label={
                  geoPermission === "denied" ? "Location access blocked" : "Use current location"
                }
                aria-disabled={geoPermission === "denied"}
                className={`size-14 shrink-0 rounded-2xl bg-bg-primary p-3 text-icon-brand [&_svg]:size-8 ${geoPermission === "denied" ? "cursor-not-allowed opacity-50" : ""}`}
                onClick={handleUseCurrentLocation}
              >
                Use current location
              </AppButton>
            </div>

            {recentSearches.length > 0 && (
              <div className="flex w-full flex-col gap-4 rounded-lg bg-bg-primary p-3">
                <div className="flex h-6 w-full items-center gap-4">
                  <span className="flex-1 text-sm font-semibold text-text-primary">
                    Recent Search
                  </span>
                  <AppButton
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={clearRecentSearches}
                  >
                    Clear
                  </AppButton>
                </div>
                <div className="flex flex-col gap-3">
                  {recentSearches.map((entry, index) => (
                    <div key={entry.line} className="flex flex-col gap-3">
                      {index > 0 && <div className="h-px w-full bg-border-default" />}
                      <button
                        type="button"
                        onClick={() => {
                          setMapCenter({ lat: entry.lat, lng: entry.lng });
                          selectResolvedAddress(entry.line, { lat: entry.lat, lng: entry.lng });
                          setMobileStep("map");
                        }}
                        className="flex w-full items-center gap-2.5 text-start"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-secondary">
                          <History className="size-4 text-icon-primary" />
                        </span>
                        <span className="line-clamp-1 flex-1 text-sm text-text-primary">
                          {entry.line}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoggedIn && savedAddresses.length > 0 && (
              <div className="flex w-full flex-col items-center gap-2">
                <span className="flex w-full items-center text-sm font-semibold text-text-primary">
                  Saved Addresses
                </span>
                <div className="flex w-full flex-col gap-3">
                  {savedAddresses.map((address) => {
                    const TypeIcon =
                      address.label === "Home"
                        ? AddressHomeIcon
                        : address.label === "Office"
                          ? AddressOfficeIcon
                          : AddressOtherIcon;
                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => {
                          setPickedAddress(null);
                          setSelectedAddressId(address.id);
                          setMapCenter({ lat: address.lat, lng: address.lng });
                          setMobileStep("map");
                        }}
                        className="flex w-full flex-col items-start gap-3 rounded-xl border border-border-default bg-bg-primary p-3 text-start"
                      >
                        <span className="flex w-full items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary">
                            <TypeIcon className="size-5 text-icon-primary" />
                          </span>
                          <span className="flex flex-1 flex-col items-start gap-0.5">
                            <span className="text-sm font-semibold text-text-primary">
                              {address.label}
                            </span>
                            {address.isDefault && (
                              <span className="text-sm font-medium text-button-link-primary-focus">
                                Default Address
                              </span>
                            )}
                          </span>
                        </span>
                        <div className="w-full border-t border-dashed border-border-default" />
                        <span className="text-sm text-text-secondary">{address.line}</span>
                        {address.mobile && (
                          <span className="flex w-full items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2.5 text-sm font-medium text-text-primary">
                            <Phone className="size-4 shrink-0 text-icon-secondary" />
                            {address.mobile}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile step 2 — full-bleed map with the search bar and result cards
            floating over it, instead of the desktop's split list/map panels. */}
        <div
          className={`relative min-h-0 flex-1 lg:hidden ${mobileStep === "map" || availabilityStatus === "unavailable" ? "" : "hidden"}`}
        >
          <LocationMap
            center={mapCenter}
            onCenterChange={availabilityStatus === "unavailable" ? undefined : handleMapPinMove}
            className="absolute inset-0 size-full"
          />

          {availabilityStatus !== "unavailable" && (
            <div className="absolute inset-x-4 top-[calc(3.5rem+1rem)] z-10 flex items-start gap-2">
              <div className="relative flex-1">
                <div
                  className={`flex h-14 items-center gap-2 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)] ${showPredictions && predictions.length > 0 ? "rounded-t-xl" : "rounded-xl"}`}
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
                        setHighlightedIndex(
                          (index) => (index - 1 + predictions.length) % predictions.length
                        );
                      } else if (event.key === "Enter") {
                        if (highlightedIndex >= 0) {
                          event.preventDefault();
                          handleSelectPrediction(predictions[highlightedIndex]);
                        }
                      } else if (event.key === "Escape") {
                        setShowPredictions(false);
                      }
                    }}
                    placeholder="Search City or Location"
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
                aria-label={
                  geoPermission === "denied" ? "Location access blocked" : "Use current location"
                }
                aria-disabled={geoPermission === "denied"}
                className={`size-14 shrink-0 rounded-2xl bg-bg-primary p-3 text-icon-brand shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)] [&_svg]:size-8 ${geoPermission === "denied" ? "cursor-not-allowed opacity-50" : ""}`}
                onClick={handleUseCurrentLocation}
              >
                Use current location
              </AppButton>
            </div>
          )}

          {availabilityStatus === "unavailable" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg-primary px-4 py-8">
              <ServiceUnavailableIllustration className="size-48" />
              <div className="flex flex-col items-center gap-2">
                <p className="text-center text-base font-bold text-text-primary">
                  Services aren&apos;t Available Here Yet
                </p>
                <p className="text-center text-xs text-text-secondary">
                  We couldn&apos;t find any providers in your selected location. Submit a request,
                  and we&apos;ll review expanding our network to your area.
                </p>
              </div>
              <div className="flex w-full items-center gap-3 rounded-xl bg-bg-secondary p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                  <LocationPinIcon className="size-5 text-icon-primary" />
                </span>
                <span className="flex flex-1 flex-col items-start">
                  <span className="line-clamp-1 text-sm font-semibold text-text-primary">
                    {requestedLocationLines?.primary ?? selectedAddress?.line ?? current}
                  </span>
                  {requestedLocationLines?.secondary && (
                    <span className="line-clamp-1 text-xs text-text-secondary">
                      {requestedLocationLines.secondary}
                    </span>
                  )}
                </span>
                <AppButton
                  variant="link"
                  size="sm"
                  iconOnly
                  leftIcon={Pencil}
                  aria-label="Edit location"
                  onClick={() => setAvailabilityStatus("idle")}
                >
                  Edit location
                </AppButton>
              </div>

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 rounded-t-xl bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
                <div className="flex flex-col items-start gap-1 self-stretch">
                  <p className="text-center text-sm font-semibold text-text-primary">
                    Want Us to Serve Your area?
                  </p>
                  <p className="text-xs text-text-secondary">
                    Submit a Request and We&apos;ll let you Know when Service is Available
                  </p>
                </div>
                <div className="h-px w-full bg-border-default" />
                <AppButton
                  variant="primary"
                  size="lg"
                  disabled={submittingAreaRequest}
                  onClick={handleRequestAreaCoverage}
                  className="w-full justify-center"
                >
                  {submittingAreaRequest ? "Submitting…" : "Request Service Here"}
                </AppButton>
              </div>
            </div>
          ) : selectedAddress ? (
            <div className="absolute inset-x-4 bottom-4 z-10 flex flex-col items-start gap-4 rounded-2xl bg-bg-primary p-3 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
              <div className="flex w-full items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg-brand-subtle">
                  <LocationPinIcon className="size-6 text-icon-brand" />
                </span>
                <div className="flex flex-1 flex-col items-start">
                  <span className="line-clamp-1 text-sm font-semibold text-text-primary">
                    {requestedLocationLines?.primary ?? selectedAddress.line}
                  </span>
                  {requestedLocationLines?.secondary && (
                    <span className="line-clamp-1 text-xs text-text-secondary">
                      {requestedLocationLines.secondary}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-px w-full bg-border-muted" />
              <AppButton
                variant="primary"
                size="lg"
                disabled={checkingAvailability}
                onClick={handleUpdateLocation}
                className="w-full justify-center"
              >
                {checkingAvailability ? "Checking availability…" : "Confirm Address"}
              </AppButton>
            </div>
          ) : (
            isLoggedIn &&
            savedAddresses.length > 0 && (
              <div className="no-scrollbar absolute inset-x-4 bottom-4 z-10 flex max-h-[60vh] flex-col gap-4 overflow-y-auto rounded-2xl bg-bg-primary p-3 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
                <span className="text-sm font-semibold text-text-primary">Saved Addresses</span>
                <div className="flex flex-col gap-3">
                  {savedAddresses.map((address) => (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => {
                        setPickedAddress(null);
                        setSelectedAddressId(address.id);
                        setMapCenter({ lat: address.lat, lng: address.lng });
                      }}
                      className="flex w-full flex-col items-start gap-2 rounded-xl border border-border-default bg-bg-primary p-3 text-start"
                    >
                      <span className="flex w-full items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">
                          {address.label}
                        </span>
                        {address.isDefault && (
                          <span className="text-xs text-text-brand">Default Address</span>
                        )}
                      </span>
                      <span className="line-clamp-2 text-xs text-text-secondary">
                        {address.line}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        <div className="hidden min-h-0 flex-1 flex-col items-stretch overflow-y-auto lg:flex lg:flex-row">
          <div className="flex w-full flex-col border-border-default lg:w-[574px] lg:shrink-0 lg:border-e">
            {availabilityStatus === "unavailable" ? (
              <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-1 flex-col items-center gap-4">
                  <ServiceUnavailableIllustration className="size-60" />
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-center text-lg font-medium text-text-primary">
                      Services aren&apos;t Available Here Yet
                    </p>
                    <p className="text-center text-base text-text-secondary">
                      This service isn&apos;t currently available in your selected area. Request
                      availability and we&apos;ll review your location.
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-3 rounded-xl border border-border-default bg-bg-secondary p-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border-default bg-bg-primary p-3">
                      <LocationPinIcon className="size-6 text-icon-primary" />
                    </span>
                    <span className="flex flex-1 flex-col items-start gap-1">
                      <span className="line-clamp-1 text-base font-medium text-text-primary">
                        {requestedLocationLines?.primary ?? selectedAddress?.line ?? current}
                      </span>
                      {requestedLocationLines?.secondary && (
                        <span className="line-clamp-1 text-sm text-text-secondary">
                          {requestedLocationLines.secondary}
                        </span>
                      )}
                    </span>
                    <AppButton
                      variant="link"
                      size="lg"
                      iconOnly
                      leftIcon={Pencil}
                      aria-label="Edit location"
                      onClick={() => setAvailabilityStatus("idle")}
                    >
                      Edit location
                    </AppButton>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-6 rounded-xl border border-border-default bg-bg-secondary p-4">
                  <div className="flex flex-col items-center gap-1 self-stretch">
                    <p className="text-center text-lg font-medium text-text-primary">
                      Want Us to Serve Your area?
                    </p>
                    <p className="text-center text-base text-text-secondary">
                      Submit a Request and We&apos;ll let you Know when Service is Available
                    </p>
                  </div>
                  <AppButton
                    variant="primary"
                    size="lg"
                    disabled={submittingAreaRequest}
                    onClick={handleRequestAreaCoverage}
                    className="w-full text-xl"
                  >
                    {submittingAreaRequest ? "Submitting…" : "Request Location Here"}
                  </AppButton>
                </div>
              </div>
            ) : (
            <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
              <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-secondary p-3">
                <span className="flex size-12 items-center justify-center rounded-lg border border-border-default bg-bg-primary p-3">
                  <LocationPinIcon className="size-6 text-icon-primary" />
                </span>
                <span className="flex flex-1 flex-col items-start gap-1">
                  <span className="text-base text-text-secondary">Location</span>
                  <span className="line-clamp-1 text-base font-medium text-text-primary">
                    {selectedAddress?.line ?? current ?? "Add Location"}
                  </span>
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-6">
                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 flex-1 items-center gap-4 rounded-lg border border-border-default bg-bg-secondary px-4 py-3">
                    <Search className="size-6 text-icon-secondary" />
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
                          setHighlightedIndex(
                            (index) => (index - 1 + predictions.length) % predictions.length
                          );
                        } else if (event.key === "Enter") {
                          if (highlightedIndex >= 0) {
                            event.preventDefault();
                            handleSelectPrediction(predictions[highlightedIndex]);
                          }
                        } else if (event.key === "Escape") {
                          setShowPredictions(false);
                        }
                      }}
                      placeholder="Search Location, Area or city name"
                      className="line-clamp-1 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-secondary focus:outline-none"
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AppButton
                        type="button"
                        variant="secondary"
                        size="lg"
                        iconOnly
                        leftIcon={CurrentLocationIcon}
                        aria-label={
                          geoPermission === "denied"
                            ? "Location access blocked"
                            : "Use current location"
                        }
                        aria-disabled={geoPermission === "denied"}
                        className={geoPermission === "denied" ? "cursor-not-allowed opacity-50" : ""}
                        onClick={handleUseCurrentLocation}
                      >
                        Use current location
                      </AppButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      {geoPermission === "denied"
                        ? "Location access blocked — enable it in your browser settings"
                        : "Use current location"}
                    </TooltipContent>
                  </Tooltip>

                  {showPredictions && predictions.length > 0 && (
                    <ul className="absolute top-14 left-0 z-10 flex max-h-72 w-full flex-col gap-1 overflow-y-auto rounded-lg border border-border-default bg-bg-primary p-2 shadow-lg">
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

                {recentSearches.length > 0 && (
                  <div className="flex flex-col gap-3 rounded-lg bg-bg-secondary p-3">
                    <div className="flex items-center gap-4">
                      <span className="flex-1 text-base font-medium text-text-primary">
                        Recent Search
                      </span>
                      <AppButton
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={clearRecentSearches}
                      >
                        Clear
                      </AppButton>
                    </div>
                    <div className="flex flex-col gap-3">
                      {recentSearches.map((entry, index) => (
                        <div key={entry.line} className="flex flex-col gap-3">
                          {index > 0 && <div className="h-px w-full bg-border-default" />}
                          <button
                            type="button"
                            onClick={() => {
                              setMapCenter({ lat: entry.lat, lng: entry.lng });
                              selectResolvedAddress(entry.line, { lat: entry.lat, lng: entry.lng });
                            }}
                            className="flex w-full items-center gap-2.5 text-start"
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-primary">
                              <History className="size-4 text-icon-primary" />
                            </span>
                            <span className="line-clamp-1 flex-1 text-sm text-text-primary">
                              {entry.line}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isLoggedIn && savedAddresses.length > 0 && (
                  <div className="flex flex-1 flex-col gap-3">
                    <span className="text-base text-text-primary">Saved Addresses</span>
                    <ToggleGroup
                      type="single"
                      value={selectedAddressId ?? ""}
                      onValueChange={(value) => {
                        setPickedAddress(null);
                        setSelectedAddressId(value || null);
                      }}
                      className="no-scrollbar max-h-[360px] flex-1 flex-col gap-4 overflow-y-auto border-0 bg-transparent p-0"
                    >
                      {savedAddresses.map((address) => (
                        <ToggleGroupItem
                          key={address.id}
                          value={address.id}
                          className="h-auto w-full flex-col items-start gap-2 rounded-lg border border-border-default bg-bg-primary p-3 data-[state=on]:bg-bg-primary"
                        >
                          <span className="flex w-full items-center justify-between gap-4">
                            <span className="flex items-center gap-2">
                              <span className="text-sm text-text-primary opacity-75">
                                {address.label}
                              </span>
                              {address.isDefault && (
                                <span className="rounded-full bg-bg-brand-subtle px-2 py-0.5 text-sm text-text-brand">
                                  Default
                                </span>
                              )}
                            </span>
                            <span className="flex items-center justify-center rounded-3xl border border-border-black p-1">
                              <span
                                className={
                                  address.id === selectedAddressId
                                    ? "size-3.5 rounded-full bg-bg-brand"
                                    : "size-3.5 rounded-full"
                                }
                              />
                            </span>
                          </span>
                          <span className="line-clamp-2 text-start text-sm text-text-primary">
                            {address.line}
                          </span>
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                )}
              </div>

              <AppButton
                variant="primary"
                size="lg"
                disabled={!selectedAddress || checkingAvailability}
                onClick={handleUpdateLocation}
                className="w-full text-xl"
              >
                {checkingAvailability
                  ? "Checking availability…"
                  : isChangeFlow
                    ? "Update Location"
                    : "Add Location"}
              </AppButton>
            </div>
            )}
          </div>

          <div className="flex-1 p-4 lg:p-6">
            <div className="relative h-64 w-full overflow-hidden rounded-xl lg:h-[652px]">
              <LocationMap
                center={mapCenter}
                onCenterChange={
                  availabilityStatus === "unavailable" ? undefined : handleMapPinMove
                }
                className="size-full"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={open && areaRequestSubmitted} onOpenChange={() => handleClose(false)}>
      <DialogContent
        showCloseButton={false}
        className="flex max-w-[539px] flex-col gap-0 overflow-hidden rounded-2xl border border-border-default bg-bg-primary p-0 sm:max-w-[539px]"
      >
        <div className="flex justify-end border-b border-border-default px-6 py-4">
          <AppButton
            variant="secondary-outline"
            size="lg"
            iconOnly
            leftIcon={X}
            aria-label="Close"
            onClick={() => handleClose(false)}
            className="rounded-lg border-border-default bg-bg-secondary p-2"
          >
            Close
          </AppButton>
        </div>

        <div className="flex flex-col items-center gap-6 p-4">
          <div className="flex flex-col items-center gap-4 self-stretch">
            <span className="flex items-center justify-center rounded-xl bg-icon-success p-3">
              <Check className="size-7 text-icon-inverse" />
            </span>
            <div className="flex flex-col items-center gap-1 self-stretch">
              <p className="text-center text-lg font-medium text-text-primary">
                Area Request Submitted
              </p>
              <p className="text-center text-sm text-text-secondary">
                Thanks for letting us know! We&apos;ve recorded your request and will work on
                making services available in your area.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 self-stretch rounded-xl border border-border-default bg-bg-secondary p-3">
            <span className="text-sm text-text-secondary">Requested Location</span>
            <div className="flex items-start gap-3 self-stretch">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border-default bg-bg-primary p-3">
                <LocationPinIcon className="size-6 text-icon-primary" />
              </span>
              <div className="flex flex-1 flex-col items-start gap-1">
                <span className="line-clamp-1 text-sm font-medium text-text-primary">
                  {requestedLocationLines?.primary}
                </span>
                {requestedLocationLines?.secondary && (
                  <span className="line-clamp-1 text-sm text-text-secondary">
                    {requestedLocationLines.secondary}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
