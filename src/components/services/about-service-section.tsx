"use client";

import { useState } from "react";
import { CheckCircleIcon, CloseCircleIcon } from "@/components/icons/icons";
import type { ServiceDetailApi } from "@/lib/services-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Rough plain-text length of the CMS description, used to decide if it needs a Read More toggle. */
const CLAMP_THRESHOLD = 220;

export function AboutServiceSection({ service }: { service: ServiceDetailApi }) {
  const { t } = useTranslation();

  return (
    <>
      <AboutServiceMobile service={service} />

      <div className="hidden flex-col items-start gap-4 self-stretch rounded-xl border border-border-default bg-bg-primary p-6 lg:flex">
        <h2 className="self-stretch text-xl font-medium text-text-primary">
          {t("services.about.title")}
        </h2>
        <div className="h-px w-full bg-border-default" />

        <div className="flex flex-col items-start gap-4 self-stretch text-base text-text-primary">
          {/* description is CMS-authored rich text (e.g. "<p>...</p>") from the provider dashboard, not user input */}
          <div className="[&_p]:m-0" dangerouslySetInnerHTML={{ __html: service.description }} />
        </div>
      </div>
    </>
  );
}

/** max-lg layout: no card, dashed-separated stacked blocks with a clamped description. */
function AboutServiceMobile({ service }: { service: ServiceDetailApi }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const plainDescription = service.description.replace(/<[^>]*>/g, "");
  const isClampable = plainDescription.length > CLAMP_THRESHOLD;

  return (
    <div className="flex flex-col divide-y divide-dashed divide-border-default border-y border-dashed border-border-default lg:hidden">
      <section className="flex flex-col items-start gap-3 py-6">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("services.about.title")}
        </h2>
        {/* description is CMS-authored rich text (e.g. "<p>...</p>") from the provider dashboard, not user input */}
        <div
          className={`w-full text-sm text-text-secondary [&_p]:m-0 ${
            isClampable && !expanded ? "line-clamp-6" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: service.description }}
        />
        {isClampable && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="text-sm font-medium text-text-brand"
          >
            {expanded ? t("common.readLess") : t("common.readMore")}
          </button>
        )}
      </section>

      {service.whats_included.length > 0 && (
        <section className="flex flex-col items-start gap-4 py-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("services.about.includedInService")}
          </h2>
          <ul className="flex flex-col items-start gap-3 self-stretch">
            {service.whats_included.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-icon-brand" />
                <span className="text-sm text-text-primary">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {service.whats_excluded.length > 0 && (
        <section className="flex flex-col items-start gap-4 py-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("services.about.excludedInService")}
          </h2>
          <ul className="flex flex-col items-start gap-3 self-stretch">
            {service.whats_excluded.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CloseCircleIcon className="mt-0.5 size-5 shrink-0 text-icon-error" />
                <span className="text-sm text-text-primary">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
