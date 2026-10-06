export interface ServiceCardData {
  /** Slug — used for routing (`/service-details/{id}`), not the numeric API id. */
  id: string;
  /** Numeric backend id — required for bookmark add/remove (`service_id`); absent on mock data. */
  serviceId?: number;
  title: string;
  image: string;
  category: string;
  rating: number;
  persons: number;
  minutes: number;
  /** Unit for `minutes` when the source duration isn't in minutes (e.g. hours/days bookings). Defaults to minutes. */
  durationType?: "minutes" | "hours" | "days";
  price: number;
  originalPrice: number;
  discountPercent: number;
  /** Optional since mock data (nearby-services.ts etc) doesn't set it. */
  providerName?: string;
  providerVerified?: boolean;
  /** From API's `is_bookmarked` (1/0) — seeds the bookmark icon's initial state. */
  isBookmarked?: boolean;
  /** Provider's location — only present from the /services listing API, used for the Map View pins. */
  lat?: number;
  lng?: number;
}

export const homeCareServices: ServiceCardData[] = [
  {
    id: "service-1",
    title: "Kitchen Cleaning",
    image: "https://placehold.co/200x260",
    category: "Home Service",
    rating: 4.8,
    persons: 5,
    minutes: 30,
    price: 70,
    originalPrice: 100,
    discountPercent: 12,
  },
  {
    id: "service-2",
    title: "Kitchen Cleaning",
    image: "https://placehold.co/200x260",
    category: "Home Service",
    rating: 4.8,
    persons: 5,
    minutes: 30,
    price: 70,
    originalPrice: 100,
    discountPercent: 12,
  },
  {
    id: "service-3",
    title: "Bathroom Deep Clean",
    image: "https://placehold.co/200x260",
    category: "Home Service",
    rating: 4.6,
    persons: 3,
    minutes: 45,
    price: 60,
    originalPrice: 85,
    discountPercent: 15,
  },
  {
    id: "service-4",
    title: "Sofa Shampooing",
    image: "https://placehold.co/200x260",
    category: "Home Service",
    rating: 4.7,
    persons: 4,
    minutes: 40,
    price: 55,
    originalPrice: 75,
    discountPercent: 10,
  },
  {
    id: "service-5",
    title: "Kitchen Cleaning",
    image: "https://placehold.co/200x260",
    category: "Home Service",
    rating: 4.8,
    persons: 5,
    minutes: 30,
    price: 70,
    originalPrice: 100,
    discountPercent: 12,
  },
  {
    id: "service-6",
    title: "Kitchen Cleaning",
    image: "https://placehold.co/200x260",
    category: "Home Service",
    rating: 4.8,
    persons: 5,
    minutes: 30,
    price: 70,
    originalPrice: 100,
    discountPercent: 12,
  },
];
