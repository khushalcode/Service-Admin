"use client";

import { useEffect, useRef, useState } from "react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ServiceHero } from "@/components/services/service-hero";
import { ServiceTabsSection } from "@/components/services/service-tabs-nav";
import { AboutServiceSection } from "@/components/services/about-service-section";
import { ServiceProviderSection } from "@/components/services/service-provider-section";
import { BrochureFilesSection } from "@/components/services/brochure-files-section";
import { FaqSection } from "@/components/services/faq-section";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { ServiceGridSection } from "@/components/home/service-grid-section";
import { ShareModal } from "@/components/ui/share-modal";
import { getServiceDetailsApi } from "@/api/apiRoutes";
import { toServiceCardData, type ServiceDetailApi, type ServiceDetailResponse } from "@/lib/services-catalog";
import { useAppSelector } from "@/store/hooks";
import { getDefaultLatLng } from "@/lib/helpers";

export function ServiceDetailsView({ service: initialService }: { service: ServiceDetailApi }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [service, setService] = useState(initialService);
  const authToken = useAppSelector((state) => state.auth.token);
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);
  const { lat, lng } = getDefaultLatLng(savedLat, savedLng);

  // SSR fetches unauthenticated (the token lives in localStorage, unreachable
  // server-side), so is_bookmarked always comes back 0 from getServerSideProps
  // even for a logged-in user who has bookmarked this service. Refetch once
  // client-side with the real auth token to pick it up.
  const hasRefetched = useRef(false);
  useEffect(() => {
    if (!authToken || hasRefetched.current) return;
    hasRefetched.current = true;
    getServiceDetailsApi({ slug: initialService.slug, latitude: lat, longitude: lng }).then((response: ServiceDetailResponse | null) => {
      if (response?.data) setService(response.data);
    });
  }, [authToken, initialService.slug, lat, lng]);

  return (
    <div className="flex flex-col">
      <PageBreadcrumb
        title="Service Details"
        share
        onShare={() => setShareOpen(true)}
        items={[
          { label: service.category.name, href: `/services?categories=${service.category.slug}` },
          { label: "Service Details" },
        ]}
      />
      <ServiceHero service={service} onShare={() => setShareOpen(true)} />

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={typeof window === "undefined" ? "" : window.location.href}
        title={service.title}
      />

      {/* max-lg has no tab bar: the same panels render as stacked sections. */}
      <div className="container flex flex-col bg-bg-primary pb-10 lg:hidden">
        <AboutServiceSection service={service} />
        <ServiceProviderSection provider={service.provider} />
        <BrochureFilesSection files={service.files} />
        <FaqSection faqs={service.faqs} />
        <ReviewsSection
          serviceSlug={service.slug}
          providerSlug={service.provider.slug}
          average={service.average_rating}
          totalRatings={service.number_of_ratings}
        />
      </div>

      <div className="hidden lg:block">
        <ServiceTabsSection
          panels={{
            about: (
              <>
                <AboutServiceSection service={service} />
                <ServiceProviderSection provider={service.provider} />
              </>
            ),
            ...(service.files.length > 0 && {
              brochure: <BrochureFilesSection files={service.files} />,
            }),
            ...(service.faqs.length > 0 && {
              faqs: <FaqSection faqs={service.faqs} />,
            }),
            ...(service.number_of_ratings > 0 && {
              reviews: (
                <ReviewsSection
                  serviceSlug={service.slug}
                  providerSlug={service.provider.slug}
                  average={service.average_rating}
                  totalRatings={service.number_of_ratings}
                />
              ),
            }),
          }}
        />
      </div>

      {service.related_services.length > 0 && (
        <ServiceGridSection
          title="Related Services"
          mobileTitle="Similar Services"
          description={`More services from ${service.category.name}`}
          ctaLabel="Browse All"
          ctaHref="/services"
          items={service.related_services.map(toServiceCardData)}
        />
      )}
    </div>
  );
}
