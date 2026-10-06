import type { GetServerSideProps } from "next";
import { ProviderDetailsLoader } from "@/components/providers/provider-details-loader";
import { MetaData } from "@/components/seo/MetaData";
import { getAllServicesApi, getProviderDetailsApi } from "@/api/apiRoutes";
import type { ProviderDetailApi, ProviderDetailResponse } from "@/lib/providers-catalog";
import {
  flattenProviderServices,
  toServiceCardData,
  type ProviderServicesGroupedResponse,
} from "@/lib/services-catalog";
import type { ServiceCardData } from "@/lib/mock-data/home-care-services";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";
import { LOCATION_COOKIE_NAME, parseLocationCookie } from "@/lib/location-cookie";
import { getDefaultLatLng } from "@/lib/helpers";

interface PageProps {
  translation: TranslationPageProps;
  provider: ProviderDetailApi | null;
  services: ServiceCardData[];
  seo: SeoSettings | null;
  slug: string;
}

export default function Page(props: Partial<PageProps>) {
  const { languages, lang, defaultLocale } = useTranslation();
  return (
    <>
      {props.seo && props.slug && (
        <MetaData
          seo={props.seo}
          pageName={`/provider-details/${props.slug}`}
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <ProviderDetailsLoader initialProvider={props.provider ?? null} initialServices={props.services ?? []} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };

        const slugParts = context.params?.slug as string[];
        const lastSlug = slugParts[slugParts.length - 1];
        const cookieLocation = parseLocationCookie(context.req.cookies[LOCATION_COOKIE_NAME]);
        const { lat, lng } = getDefaultLatLng(cookieLocation?.lat, cookieLocation?.lng);

        const [providerResponse, seo] = await Promise.all([
          getProviderDetailsApi({ slug: lastSlug, latitude: lat, longitude: lng }) as Promise<
            ProviderDetailResponse | null
          >,
          fetchSeoSettings("provider-details", lastSlug),
        ]);

        if (!providerResponse || providerResponse.error || !providerResponse.data) {
          return { notFound: true };
        }

        const servicesResponse: ProviderServicesGroupedResponse | null = await getAllServicesApi({
          provider_id: providerResponse.data.partner_id,
          latitude: lat,
          longitude: lng,
          limit: 12,
        });

        return {
          props: {
            translation,
            provider: providerResponse.data,
            services: flattenProviderServices(servicesResponse).map(toServiceCardData),
            seo,
            slug: lastSlug,
          },
        };
      });
    }
  : undefined;
