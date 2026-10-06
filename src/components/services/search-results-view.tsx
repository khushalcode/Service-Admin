"use client";

import { useMemo, useState } from "react";
import { Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ListingLayout } from "@/components/layout/listing-layout";
import { getListingGridClassName } from "@/lib/listing-grid";
import { ListingToolbar } from "@/components/layout/listing-toolbar";
import { ServiceFilters } from "@/components/services/service-filters";
import {
  DEFAULT_MOBILE_FILTERS,
  MobileFilterSheet,
  type MobileFiltersValue,
} from "@/components/services/mobile-filter-sheet";
import { FilterChip } from "@/components/ui/filter-chip";
import { ListingMapView, type ListingMapPin } from "@/components/layout/listing-map-view";
import { ServiceCard } from "@/components/home/service-card";
import { EmptyState } from "@/components/ui/empty-state";
import { AppButton } from "@/components/ui/app-button";
import { Link } from "@/components/ui/locale-link";
import MobileBreadcrum from "@/components/common/MobileBreadcrumb";
import { ServiceIcon } from "@/components/icons/icons";
import type { ServiceCardData } from "@/lib/mock-data/home-care-services";
import { useTranslation } from "@/lib/i18n/translation-context";
import { usePathname } from "next/navigation";

const DURATION_BUCKET_MINUTES: Record<string, { min?: number; max?: number }> = {
  under30Min: { max: 29 },
  "30to60Min": { min: 30, max: 60 },
  "1to2Hours": { min: 61, max: 120 },
  "2to4Hours": { min: 121, max: 240 },
  "4PlusHours": { min: 241 },
};

function matchesDurations(minutes: number, durations: string[]): boolean {
  if (durations.length === 0) return true;
  return durations.some((key) => {
    const bucket = DURATION_BUCKET_MINUTES[key];
    if (!bucket) return true;
    return (
      (bucket.min === undefined || minutes >= bucket.min) &&
      (bucket.max === undefined || minutes <= bucket.max)
    );
  });
}

export function SearchResultsView({
  query,
  services,
}: {
  query: string;
  services: ServiceCardData[];
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isSearchPage = pathname.includes('search');

  const [sortValue, setSortValue] = useState("all");
  const [searchValue, setSearchValue] = useState(query);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useState<MobileFiltersValue>(DEFAULT_MOBILE_FILTERS);
  const [mapOpen, setMapOpen] = useState(false);

  // The search page ships a fixed result set, so max-lg narrows and orders it
  // client-side instead of refetching.
  const mobileServices = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    const filtered = services.filter((service) => {
      if (term && !service.title.toLowerCase().includes(term)) return false;
      if (mobileFilters.rating !== null && service.rating < mobileFilters.rating) return false;
      if (mobileFilters.priceMax != null && service.price > mobileFilters.priceMax) return false;
      return matchesDurations(service.minutes, mobileFilters.durations);
    });

    switch (mobileFilters.sort) {
      case "rating":
        return [...filtered].sort((a, b) => b.rating - a.rating);
      case "price-desc":
        return [...filtered].sort((a, b) => b.price - a.price);
      case "price-asc":
        return [...filtered].sort((a, b) => a.price - b.price);
      // "nearest" keeps the incoming order — these results already arrive
      // nearest-first and the cards carry no distance to re-sort by.
      default:
        return filtered;
    }
  }, [services, searchValue, mobileFilters]);

  // Only listing-API results carry provider coordinates — without them there
  // is nothing to pin, so the map entry point stays hidden.
  const mapPins: ListingMapPin[] = useMemo(
    () =>
      mobileServices
        .filter((service) => service.lat != null && service.lng != null)
        .map((service) => ({
          id: service.id,
          position: { lat: service.lat as number, lng: service.lng as number },
          href: `/service-details/${service.id}`,
        })),
    [mobileServices]
  );

  return (
    <>
      <div className="flex flex-col lg:hidden">
        <MobileBreadcrum
          title={t("search.explore")}
          headerAction={
            mapPins.length > 0 ? (
              <AppButton
                variant="secondary"
                size="sm"
                leftIcon={MapIcon}
                className="rounded-lg"
                onClick={() => setMapOpen(true)}
              >
                {t("common.map")}
              </AppButton>
            ) : undefined
          }
        />

        <div className="flex flex-1 flex-col gap-4 bg-bg-secondary pb-6">
          <div className="container flex flex-col gap-4 bg-bg-primary pt-1 pb-3">
            <form
              role="search"
              onSubmit={(event) => event.preventDefault()}
              className="flex items-center gap-3"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-icon-secondary" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={t("services.searchPlaceholder")}
                  className="w-full rounded-lg border border-border-brand bg-bg-secondary py-2.5 pr-10 pl-10 text-sm text-text-primary outline-none placeholder:text-text-secondary"
                />
                {searchValue.length > 0 && (
                  <button
                    type="button"
                    aria-label={t("search.clearSearch")}
                    onClick={() => setSearchValue("")}
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    <X className="size-4 text-icon-primary" />
                  </button>
                )}
              </div>
              <FilterChip active={false} icon={SlidersHorizontal} onClick={() => setFiltersOpen(true)}>
                {t("common.sortAndFilter")}
              </FilterChip>
            </form>

            <div className="flex items-center border-b border-border-default">
              <span className="flex-1 border-b-2 border-bg-brand pb-2 text-center text-sm font-medium text-text-brand">
                {t("search.servicesTab")}
              </span>
              <AppButton
                asChild
                variant="link"
                className="flex-1 border-b-2 border-transparent p-0 pb-2 text-sm text-text-secondary"
              >
                <Link href={`/providers?q=${encodeURIComponent(searchValue)}`}>
                  {t("search.providerTab")}
                </Link>
              </AppButton>
            </div>
          </div>

          <div className="container flex flex-col gap-3">
            {
              isSearchPage &&
              <h1 className="text-base font-semibold text-text-primary">
                {t("search.exploreServices")}
              </h1>
            }

            {mobileServices.length === 0 ? (
              <EmptyState
                icon={ServiceIcon}
                title={t("search.noResultsTitle")}
                description={t("search.noResultsDescription")}
              />
            ) : (
              mobileServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))
            )}
          </div>
        </div>

        {mapOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary">
            <div className="flex items-center gap-4 border-b border-border-default px-4 py-3">
              <span className="flex-1 text-base font-semibold text-text-primary">
                {t("common.mapViewTitle")}
              </span>
              <AppButton
                variant="secondary-outline"
                size="sm"
                iconOnly
                leftIcon={(iconProps) => <X {...iconProps} />}
                aria-label={t("common.close")}
                onClick={() => setMapOpen(false)}
              >
                {t("common.close")}
              </AppButton>
            </div>
            <div className="flex-1">
              <ListingMapView pins={mapPins} kind="service" />
            </div>
          </div>
        )}

        <MobileFilterSheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          value={mobileFilters}
          onApply={setMobileFilters}
        />
      </div>

      <div className="hidden flex-col lg:flex">
        <PageBreadcrumb title="Search Results" items={[{ label: "Search Results" }]} />
        <ListingLayout
          toolbar={
            <ListingToolbar
              resultsLabel={`Showing ${services.length} of 40 services for "${query}"`}
              sortOptions={[
                { label: "All", value: "all" },
                { label: "Price: High To Low", value: "price-desc" },
                { label: "Price: Low To High", value: "price-asc" },
                { label: "Highly Rated", value: "rating" },
              ]}
              sortValue={sortValue}
              onSortChange={setSortValue}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder="Search for Services"
            />
          }
          filters={<ServiceFilters />}
          contentClassName={getListingGridClassName(2)}
        >
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </ListingLayout>
      </div>
    </>
  );
}
