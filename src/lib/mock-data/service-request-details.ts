import { serviceRequests, type ServiceRequest } from "@/lib/mock-data/service-requests";

export interface ServiceRequestAttachment {
  id: string;
  name: string;
  kind: "image" | "video" | "document";
}

export interface ServiceRequestBid {
  id: string;
  providerName: string;
  avatar: string;
  rating: number;
  reviewCount: string;
  distanceKm: number;
  priceLabel: string;
  durationLabel: string;
  message: string;
  placedAtLabel: string;
}

export interface ServiceRequestDetail extends ServiceRequest {
  /** ISO instant the offer window closes — the "Hours Left" banner counts down live to this. */
  expiresAt: string;
  startDateLabel: string;
  endDateLabel: string;
  serviceType: string;
  phone: string;
  address: string;
  attachments: ServiceRequestAttachment[];
  bids: ServiceRequestBid[];
  /** Only present when status === "cancelled". */
  cancellationReason?: string;
}

const attachments: ServiceRequestAttachment[] = [
  { id: "att-1", name: "image.jpg", kind: "image" },
  { id: "att-2", name: "video1234.mp4", kind: "video" },
  { id: "att-3", name: "document123456.jpg", kind: "document" },
];

const bidTemplate: Omit<ServiceRequestBid, "id"> = {
  providerName: "PlumbService Pvt Ltd",
  avatar: "https://placehold.co/48x48",
  rating: 4.5,
  reviewCount: "4.2K",
  distanceKm: 2,
  priceLabel: "$30-$40",
  durationLabel: "120 Minutes",
  message:
    "Certified Daikin technician, 6+ years experience. Can service both units in one visit, bring all tools and gas refill cylinders. Available this Saturday 9–11 AM.",
  placedAtLabel: "30 May, 2026 - 10:00 PM",
};

const bids: ServiceRequestBid[] = Array.from({ length: 4 }, (_, index) => ({
  id: `bid-${index + 1}`,
  ...bidTemplate,
}));

/** Synthesizes a full detail record for a request-card id — mock only, no API yet. */
export function getServiceRequestDetail(id: string): ServiceRequestDetail | null {
  const base = serviceRequests.find((request) => request.id === id);
  if (!base) return null;

  return {
    ...base,
    description:
      "Need a certified AC technician to service 2 split ACs (1.5 ton each) and refill refrigerant if required. Both units are 3 years old, last serviced 14 months ago. AC in bedroom is cooling slowly, possible gas leak. Living room unit is fine but needs a full service. Preferred timing is weekend mornings so someone is home. Please bring standard cleaning kit and gas refill equipment.",
    // Live "Hours Left" banner counts down to the request's scheduled start
    // date — computed fresh (now + 2 days) each call so the demo timer is
    // always counting down from a real future instant, not a fixed one.
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    startDateLabel: "29/05/2026 - 09:04 AM",
    endDateLabel: "30/05/2026 - 11:00 AM",
    serviceType: "At Doorstep",
    phone: "+91 12345 67890",
    address: "#262-263, Time Square Empire, SH 42 Mirjapar Highway, Bhuj - Kutch 370001 Gujarat India.",
    attachments,
    bids: base.status === "requested" ? bids.slice(0, base.bidderCount > 4 ? 4 : 1) : bids,
    cancellationReason: base.status === "cancelled" ? "Change of plans" : undefined,
  };
}
