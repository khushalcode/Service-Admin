import { Link } from "@/components/ui/locale-link";
import type { ServiceCardData } from "@/lib/mock-data/home-care-services";
import { ServiceCard } from "@/components/home/service-card";
import { DoubleChevronRightIcon } from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";

export function ServiceGridSection({
  title,
  mobileTitle,
  description,
  ctaLabel,
  ctaHref,
  items,
  background,
}: {
  title: string;
  /** max-lg heading, when the compact layout names the section differently. Falls back to `title`. */
  mobileTitle?: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  items: ServiceCardData[];
  background?: string;
}) {
  return (
    <section
      className={`${background ?? ""} commonPY max-lg:border-t max-lg:border-dashed max-lg:border-border-default`}
    >
      {/* max-lg: heading plus a swipeable rail instead of the grid. */}
      <div className="container flex flex-col gap-3 lg:hidden">
        <h2 className="text-base font-semibold text-text-primary">
          {mobileTitle ?? title}
        </h2>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
          {items.map((service) => (
            <div
              key={service.id}
              className="w-[88%] shrink-0 snap-start rounded-xl border border-border-default"
            >
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      </div>

      <div className="container hidden flex-col gap-7 lg:flex">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-text-primary sm:text-2xl">
              {title}
            </h2>
            <p className="text-base text-text-secondary sm:text-lg">
              {description}
            </p>
          </div>
          <AppButton
            asChild
            variant="link"
            size="sm"
            className="shrink-0 gap-1 p-0 text-base text-button-link-primary-text hover:text-button-link-primary-text"
          >
            <Link href={ctaHref}>
              <span className="hidden sm:inline">{ctaLabel}</span>
              <DoubleChevronRightIcon className="size-4 rtl:rotate-180" />
            </Link>
          </AppButton>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
