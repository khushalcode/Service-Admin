"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormFieldLabel } from "@/components/auth/shared/form-field-label";
import { LocationMap, type LatLng } from "@/components/maps/location-map";
import {
  addAddressApi,
  getAddressCustomFieldsApi,
  getPlacesForWebApi,
  getPlacesDeatilsForWebApi,
  normalizeAddressType,
  type AddressApi,
  type AddressCustomFieldApi,
  type AddressCustomFieldsResponse,
  type AddressType,
} from "@/api/apiRoutes";
import {
  type PlaceDetailsByIdResponse,
  type PlacePrediction,
  type PlacesForWebResponse,
} from "@/lib/places-catalog";
import { getDefaultLatLng } from "@/lib/helpers";
import { AddressHomeIcon, AddressOfficeIcon, AddressOtherIcon } from "@/components/icons/icons";
import { useAppSelector } from "@/store/hooks";
import { useTranslation } from "@/lib/i18n/translation-context";

const TYPE_OPTIONS: { value: AddressType; icon: typeof AddressHomeIcon }[] = [
  { value: "home", icon: AddressHomeIcon },
  { value: "office", icon: AddressOfficeIcon },
  { value: "other", icon: AddressOtherIcon },
];

export function AddressFormDialog({
  open,
  onOpenChange,
  address,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** undefined/null = add mode; a loaded address = edit mode. */
  address?: AddressApi | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);

  const typeLabel: Record<AddressType, string> = {
    home: t("account.addresses.typeHome"),
    office: t("account.addresses.typeOffice"),
    other: t("account.addresses.typeOther"),
  };

  const [type, setType] = useState<AddressType>("home");
  const [mobile, setMobile] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLng>(() => getDefaultLatLng(savedLat, savedLng));

  const [customFields, setCustomFields] = useState<AddressCustomFieldApi[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, string>>({});
  const [loadingFields, setLoadingFields] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchDraft, setSearchDraft] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Re-seed every time the dialog opens (or the target address changes) —
  // this dialog instance is shared between add and edit, so state from a
  // previous open must not leak into the next one.
  useEffect(() => {
    if (!open) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seeding form state from the `address` prop each time the dialog opens, not derivable from render
    setType(address ? normalizeAddressType(address.type) : "home");
    setMobile(address?.mobile ?? "");
    setIsDefault(address?.is_default === "1");
    setSearchDraft("");
    setPredictions([]);

    const lat = address ? Number.parseFloat(address.lattitude) : null;
    const lng = address ? Number.parseFloat(address.longitude) : null;
    setMapCenter(
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { lat: lat as number, lng: lng as number }
        : getDefaultLatLng(savedLat, savedLng)
    );

    setLoadingFields(true);
    getAddressCustomFieldsApi({ address_id: address?.id || undefined }).then(
      (response: AddressCustomFieldsResponse | null) => {
        const fields = response?.data?.custom_fields ?? [];
        const existingValues = response?.data?.customer_address_custom_fields ?? [];
        setCustomFields(fields);
        setCustomFieldValues(
          Object.fromEntries(existingValues.map((item) => [item.custom_field_id, item.value]))
        );
        setLoadingFields(false);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, address?.id]);

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
    } catch (error) {
      console.warn("Failed to resolve place details:", error);
    }
  };

  const handleClose = (next: boolean) => onOpenChange(next);

  const handleSubmit = async () => {
    if (!mobile.trim()) {
      toast.error(t("account.addresses.form.mobileRequired"));
      return;
    }
    const missingField = customFields.find(
      (field) => field.required === 1 && !(customFieldValues[field.id] ?? "").trim()
    );
    if (missingField) {
      toast.error(t("account.addresses.form.fieldRequired"));
      return;
    }

    setSaving(true);
    try {
      const response = await addAddressApi({
        address_id: address?.id || undefined,
        mobile,
        alternate_mobile: mobile,
        lattitude: mapCenter.lat,
        longitude: mapCenter.lng,
        type,
        is_default: isDefault ? "1" : "0",
        custom_fields: JSON.stringify(
          customFields.map((field) => ({
            custom_field_id: field.id,
            value: customFieldValues[field.id] ?? "",
          }))
        ),
      });
      if (response?.error) throw new Error(response?.message);
      toast.success(t("account.addresses.form.saveSuccess"));
      onSaved();
      handleClose(false);
    } catch {
      toast.error(t("account.addresses.form.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-border-default bg-bg-primary p-0 lg:max-w-[1000px]"
      >
        <DialogHeader className="flex-row shrink-0 items-center gap-6 border-b border-border-default px-4 py-4 lg:px-6">
          <DialogTitle className="flex-1 text-start text-lg font-medium text-text-primary">
            {address ? t("account.addresses.form.editTitle") : t("account.addresses.form.addTitle")}
          </DialogTitle>
          <AppButton
            variant="secondary-outline"
            size="md"
            iconOnly
            leftIcon={X}
            aria-label="Close"
            onClick={() => handleClose(false)}
            className="rounded-lg border-border-default bg-bg-secondary p-2"
          >
            Close
          </AppButton>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 lg:flex-row lg:overflow-hidden">
          <div className="relative h-64 flex-1 overflow-hidden rounded-xl lg:h-[508px]">
            <LocationMap center={mapCenter} onCenterChange={setMapCenter} className="size-full" />
            {/* Leaflet's own control panes (.leaflet-top etc) use z-index up to 1000,
                which otherwise paints over any sibling overlay at a "normal" z-index
                despite hit-testing still favoring the overlay — must clear that. */}
            <div className="absolute left-6 top-6 z-[1001] flex w-[calc(100%-3rem)] max-w-96 items-center gap-4 rounded-lg border border-border-default bg-bg-primary px-4 py-3 shadow-[0px_6px_12px_0px_rgba(0,0,0,0.07)]">
              <Search className="size-6 shrink-0 text-icon-secondary" />
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
                  } else if (event.key === "Enter") {
                    if (highlightedIndex >= 0) {
                      event.preventDefault();
                      handleSelectPrediction(predictions[highlightedIndex]);
                    }
                  } else if (event.key === "Escape") {
                    setShowPredictions(false);
                  }
                }}
                placeholder={t("account.addresses.form.searchPlaceholder")}
                className="line-clamp-1 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-secondary focus:outline-none"
              />
            </div>
            {showPredictions && predictions.length > 0 && (
              <ul className="absolute left-6 top-[4.75rem] z-[1001] flex max-h-72 w-[calc(100%-3rem)] max-w-96 flex-col gap-1 overflow-y-auto rounded-lg border border-border-default bg-bg-primary p-2 shadow-lg">
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

          <div className="flex flex-1 flex-col items-start gap-6 lg:h-[508px]">
            <div className="flex w-full shrink-0 items-start gap-3">
              {TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={
                      active
                        ? "flex items-center gap-2 rounded-3xl border border-border-brand bg-bg-brand-subtle px-3 py-2 text-sm text-text-brand"
                        : "flex items-center gap-2 rounded-3xl border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary"
                    }
                  >
                    <Icon className="size-4" />
                    {typeLabel[option.value]}
                  </button>
                );
              })}
            </div>

            <div className="flex w-full shrink-0 flex-col items-start gap-2">
              <FormFieldLabel label={t("account.addresses.form.mobileNumber")} required />
              <input
                type="tel"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                placeholder={t("account.addresses.form.mobilePlaceholder")}
                className="w-full rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text placeholder:text-form-field-placeholder focus:border-form-field-focus focus:outline-none"
              />
            </div>

            {/* Custom field count varies per admin config — this section scrolls on
                its own so the type/mobile header and the checkbox/submit footer stay
                pinned regardless of how many fields come back. */}
            <div className="flex min-h-0 w-full flex-1 flex-col items-start gap-4 overflow-y-auto pe-1">
              {loadingFields &&
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex w-full shrink-0 flex-col items-start gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-sm" />
                  </div>
                ))}
              {!loadingFields &&
                customFields.map((field) => (
                  <div key={field.id} className="flex w-full shrink-0 flex-col items-start gap-2">
                    <FormFieldLabel label={field.translated_label} required={field.required === 1} />
                    {field.field_type === "textarea" ? (
                      <textarea
                        value={customFieldValues[field.id] ?? ""}
                        onChange={(event) =>
                          setCustomFieldValues((current) => ({
                            ...current,
                            [field.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text placeholder:text-form-field-placeholder focus:border-form-field-focus focus:outline-none"
                      />
                    ) : (
                      <input
                        type={field.field_type === "number" ? "number" : "text"}
                        value={customFieldValues[field.id] ?? ""}
                        onChange={(event) =>
                          setCustomFieldValues((current) => ({
                            ...current,
                            [field.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text placeholder:text-form-field-placeholder focus:border-form-field-focus focus:outline-none"
                      />
                    )}
                  </div>
                ))}
            </div>

            <label className="flex shrink-0 items-center gap-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(event) => setIsDefault(event.target.checked)}
                className="size-4 rounded-sm border border-border-black accent-bg-brand"
              />
              <span className="text-sm text-text-secondary">
                {t("account.addresses.form.setAsDefault")}
              </span>
            </label>

            <AppButton
              variant="primary"
              size="md"
              disabled={saving}
              onClick={handleSubmit}
              className="w-full shrink-0"
            >
              {saving ? t("account.addresses.form.saving") : t("account.addresses.form.continue")}
            </AppButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
