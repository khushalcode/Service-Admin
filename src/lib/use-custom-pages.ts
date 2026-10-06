"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomPagesApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";

export interface CustomPageLink {
  slug: string;
  title: string;
}

interface CustomPageApi {
  slug?: string;
  title?: string;
  translated_title?: string;
}

/** Footer's admin-created page links — cached per language since `translated_title` changes with Content-Language. */
export function useCustomPages() {
  const { lang } = useTranslation();

  const query = useQuery({
    queryKey: ["custom_pages", lang],
    queryFn: async (): Promise<CustomPageLink[]> => {
      const response = await getCustomPagesApi();
      if (response?.error) throw new Error(response?.message);
      const list: CustomPageApi[] = response?.data ?? [];
      return list
        .filter((page): page is CustomPageApi & { slug: string } => Boolean(page.slug))
        .map((page) => ({ slug: page.slug, title: page.translated_title || page.title || page.slug }));
    },
  });

  return {
    pages: query.data ?? [],
    status: query.isPending ? "loading" : query.isError ? "error" : "loaded",
  } as const;
}
