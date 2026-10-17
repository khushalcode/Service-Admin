import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { SearchResultsView } from "@/components/services/search-results-view";
import { nearbyServices } from "@/lib/mock-data/nearby-services";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";

interface PageProps {
  translation: TranslationPageProps;
}

export default function Page() {
  const router = useRouter();
  const rawSlug = router.query.slug;
  const slug = typeof rawSlug === "string" ? rawSlug : "";
  const query = decodeURIComponent(slug).replace(/-/g, " ");

  return <SearchResultsView query={query} services={nearbyServices} />;
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      const translation = await getTranslationProps(lang);
      if (!translation) return { notFound: true };
      return { props: { translation } };
    }
  : undefined;
