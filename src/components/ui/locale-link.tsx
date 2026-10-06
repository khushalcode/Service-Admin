"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";

type Props = ComponentProps<typeof NextLink>;

function localizeHref(href: Props["href"], lang: string, defaultLocale: string): Props["href"] {
  if (typeof href !== "string") return href;
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    /^[a-z]+:\/\//i.test(href)
  ) {
    return href;
  }
  if (!href.startsWith("/")) return href;
  return localizePath(href, lang, defaultLocale);
}

export function Link({ href, ...props }: Props) {
  const { lang, defaultLocale } = useTranslation();
  return <NextLink href={localizeHref(href, lang, defaultLocale)} {...props} />;
}
