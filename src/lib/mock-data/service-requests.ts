import type { StatusTone } from "@/lib/helpers";

export type ServiceRequestStatus = "requested" | "booked" | "cancelled" | "expired";

export interface ServiceRequestBidder {
  id: string;
  avatar: string;
}

export interface ServiceRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  minPrice: number;
  maxPrice: number;
  status: ServiceRequestStatus;
  bidders: ServiceRequestBidder[];
  bidderCount: number;
}

export const SERVICE_REQUEST_STATUS_TONE: Record<ServiceRequestStatus, StatusTone> = {
  requested: "warning",
  booked: "success",
  cancelled: "error",
  expired: "error",
};

/** "Expiry" doesn't fit the shared warning/error/success token palette — Figma
 * calls for this exact red-100/orange-600 pairing instead of an alert token. */
export const EXPIRED_BADGE_CLASS = { bg: "bg-red-100", text: "text-orange-600" };

const bidderAvatars: ServiceRequestBidder[] = Array.from({ length: 4 }, (_, index) => ({
  id: `bidder-${index + 1}`,
  avatar: "https://placehold.co/36x36",
}));

export const serviceRequests: ServiceRequest[] = [
  {
    id: "request-1",
    category: "Home Service",
    title: "Kitchen Cleaning",
    description: "I want to clean my cabinets and Refrigerator",
    minPrice: 30,
    maxPrice: 40,
    status: "cancelled",
    bidders: bidderAvatars,
    bidderCount: 16,
  },
  {
    id: "request-2",
    category: "Home Service",
    title: "Bathroom Deep Clean",
    description: "Need a full bathroom deep clean including grout and tiles",
    minPrice: 25,
    maxPrice: 35,
    status: "cancelled",
    bidders: bidderAvatars,
    bidderCount: 16,
  },
  {
    id: "request-3",
    category: "Home Service",
    title: "Kitchen Cleaning",
    description: "I want to clean my cabinets and Refrigerator",
    minPrice: 30,
    maxPrice: 40,
    status: "requested",
    bidders: bidderAvatars,
    bidderCount: 16,
  },
  {
    id: "request-4",
    category: "Home Service",
    title: "Garden Maintenance",
    description: "Weekly lawn mowing and hedge trimming needed",
    minPrice: 45,
    maxPrice: 60,
    status: "requested",
    bidders: bidderAvatars,
    bidderCount: 16,
  },
  {
    id: "request-5",
    category: "Home Service",
    title: "Kitchen Cleaning",
    description: "I want to clean my cabinets and Refrigerator",
    minPrice: 30,
    maxPrice: 40,
    status: "booked",
    bidders: bidderAvatars,
    bidderCount: 16,
  },
  {
    id: "request-6",
    category: "Home Service",
    title: "Electrical Wiring Check",
    description: "Need a licensed electrician to inspect the wiring",
    minPrice: 50,
    maxPrice: 80,
    status: "booked",
    bidders: bidderAvatars,
    bidderCount: 16,
  },
  {
    id: "request-7",
    category: "Home Service",
    title: "AC Servicing",
    description: "Annual maintenance for two split AC units",
    minPrice: 40,
    maxPrice: 55,
    status: "requested",
    bidders: bidderAvatars,
    bidderCount: 16,
  },
  {
    id: "request-8",
    category: "Home Service",
    title: "Painting Touch-Up",
    description: "Small wall touch-ups in the living room",
    minPrice: 20,
    maxPrice: 30,
    status: "booked",
    bidders: bidderAvatars,
    bidderCount: 16,
  },
  {
    id: "request-9",
    category: "Home Service",
    title: "Pest Control",
    description: "General pest control treatment for the apartment",
    minPrice: 35,
    maxPrice: 50,
    status: "cancelled",
    bidders: bidderAvatars,
    bidderCount: 16,
  },
];
