import type { GetServerSideProps } from "next";
import { ServicesView } from "@/components/services/services-view";
import { MetaData } from "@/components/seo/MetaData";
import { LOCATION_COOKIE_NAME, parseLocationCookie } from "@/lib/location-cookie";
import { getAllServicesApi } from "@/api/apiRoutes";
import { toServiceCardData, type ServiceListResponse } from "@/lib/services-catalog";
import type { ServiceCardData } from "@/lib/mock-data/home-care-services";
import {
  DEFAULT_SERVICES_QUERY,
  PRICE_MAX,
  PRICE_MIN,
  SORT_VALUE_TO_API,
  parseServicesQuery,
  toDurationRange,
  type ServicesQueryState,
} from "@/lib/services-query";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";

const PAGE_SIZE = 10;

interface PageProps {
  translation: TranslationPageProps;
  initialServices: ServiceCardData[];
  initialTotal: number;
  initialQuery: ServicesQueryState;
  initialLat: number | null;
  initialLng: number | null;
  initialPriceBounds: { min: number; max: number };
  seo: SeoSettings | null;
}

function paramGetter(query: Record<string, string | string[] | undefined>) {
  return (key: string): string | null => {
    const value = query[key];
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value[0] ?? null;
    return null;
  };
}

export default function Page(props: Partial<PageProps>) {
  const { languages, lang, defaultLocale } = useTranslation();
  return (
    <>
      {props.seo && (
        <MetaData
          seo={props.seo}
          pageName="/services"
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <ServicesView
        initialServices={props.initialServices ?? []}
        initialTotal={props.initialTotal ?? 0}
        initialQuery={props.initialQuery ?? DEFAULT_SERVICES_QUERY}
        initialLat={props.initialLat ?? null}
        initialLng={props.initialLng ?? null}
        initialPriceBounds={props.initialPriceBounds ?? { min: PRICE_MIN, max: PRICE_MAX }}
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };

        const query = parseServicesQuery(paramGetter(context.query));
        const durationRange = toDurationRange(query.durations);
        const location = parseLocationCookie(context.req.cookies[LOCATION_COOKIE_NAME]);

        const [response, seo]: [ServiceListResponse | null, SeoSettings] = await Promise.all([
          getAllServicesApi({
            latitude: location?.lat,
            longitude: location?.lng,
            search: query.search || undefined,
            limit: PAGE_SIZE,
            offset: query.page * PAGE_SIZE,
            category_slugs: query.categorySlugs.length > 0 ? query.categorySlugs : undefined,
            duration_min: durationRange.min,
            duration_max: durationRange.max,
            rating_min: query.rating ?? undefined,
            price_min: query.priceMin ?? undefined,
            price_max: query.priceMax ?? undefined,
            sort_by: SORT_VALUE_TO_API[query.sort],
          }),
          fetchSeoSettings("services-page", null),
        ]);

        return {
          props: {
            translation,
            initialServices: (response?.data ?? []).map(toServiceCardData),
            initialTotal: response?.total ?? 0,
            initialQuery: query,
            initialLat: location?.lat ?? null,
            initialLng: location?.lng ?? null,
            initialPriceBounds: {
              min: response?.service_min_price ?? PRICE_MIN,
              max: response?.service_max_price ?? PRICE_MAX,
            },
            seo,
          },
        };
      });
    }
  : undefined;
