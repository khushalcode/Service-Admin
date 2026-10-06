import { useEffect, useState } from "react";
import enDictionary from "@/dictionaries/en.json";
import { fetchLanguageListClient, getDictionaryClient } from "@/lib/i18n/client-translation";
import type { TranslationPageProps } from "@/lib/i18n/page-props";

// SEO=false pages render with no server-fetched translation (that's the
// whole point — no getServerSideProps means Automatic Static
// Optimization, which is what gives us the shared out/[lang]/ build).
// This hook resolves the real dictionary/language list client-side once
// the real `lang` is known from the browser URL.
export function useClientTranslation(lang: string | undefined): TranslationPageProps | null {
  const [translation, setTranslation] = useState<TranslationPageProps | null>(null);

  useEffect(() => {
    if (!lang) return;
    let cancelled = false;

    async function load() {
      const { languages, defaultLocale } = await fetchLanguageListClient();
      const language = languages.find((item) => item.code === lang) ?? languages[0];
      const dictionary = await getDictionaryClient(lang as string);
      if (cancelled) return;
      setTranslation({
        dictionary,
        baseDictionary: enDictionary,
        lang: lang as string,
        isRtl: language?.isRtl ?? false,
        languages,
        defaultLocale,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return translation;
}
