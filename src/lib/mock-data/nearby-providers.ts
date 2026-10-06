export interface NearbyProvider {
  /** Slug — used for routing (`/provider-details/{id}`), not the numeric API id. */
  id: string;
  /** Numeric backend id — required for bookmark add/remove (`partner_id`); absent on mock data. */
  providerId?: number;
  name: string;
  avatar: string;
  banner: string;
  serviceCount: number;
  distanceKm: number;
  rating: number;
  startingPrice: number;
  href: string;
  verified?: boolean;
  /** From API's `is_bookmarked` (1/0) — seeds the bookmark icon's initial state. */
  isBookmarked?: boolean;
  nextAvailable?: { date: string; starting_time: string; ending_time: string };
  /** Only present from the /providers listing API — used for the Map View pins. */
  lat?: number;
  lng?: number;
}

export const nearbyProviders: NearbyProvider[] = [
  {
    id: "provider-1",
    name: "PlumbService Pvt Ltd",
    avatar: "https://placehold.co/48x48",
    banner: "https://placehold.co/384x176",
    serviceCount: 10,
    distanceKm: 2,
    rating: 4.5,
    startingPrice: 70,
    href: "/provider-details/plumbservice-pvt-ltd",
  },
  {
    id: "provider-2",
    name: "CleanPro Home Services",
    avatar: "https://placehold.co/48x48",
    banner: "https://placehold.co/384x176",
    serviceCount: 8,
    distanceKm: 3.4,
    rating: 4.7,
    startingPrice: 55,
    verified: true,
    href: "/provider-details/cleanpro-home-services",
  },
  {
    id: "provider-3",
    name: "SparkElectric Co.",
    avatar: "https://placehold.co/48x48",
    banner: "https://placehold.co/384x176",
    serviceCount: 12,
    distanceKm: 1.2,
    rating: 4.3,
    startingPrice: 90,
    href: "/provider-details/spark-electric-co",
  },
  {
    id: "provider-4",
    name: "FreshLaundry Experts",
    avatar: "https://placehold.co/48x48",
    banner: "https://placehold.co/384x176",
    serviceCount: 6,
    distanceKm: 4.8,
    rating: 4.6,
    startingPrice: 40,
    href: "/provider-details/freshlaundry-experts",
  },
  {
    id: "provider-5",
    name: "HandyFix Repairs",
    avatar: "https://placehold.co/48x48",
    banner: "https://placehold.co/384x176",
    serviceCount: 15,
    distanceKm: 2.9,
    rating: 4.4,
    startingPrice: 60,
    href: "/provider-details/handyfix-repairs",
    verified: true,
  },
  {
    id: "provider-6",
    name: "GreenLawn Care",
    avatar: "https://placehold.co/48x48",
    banner: "https://placehold.co/384x176",
    serviceCount: 9,
    distanceKm: 3.6,
    rating: 4.5,
    startingPrice: 45,
    href: "/provider-details/greenlawn-care",
  },
  {
    id: "provider-7",
    name: "PestGuard Solutions",
    avatar: "https://placehold.co/48x48",
    banner: "https://placehold.co/384x176",
    serviceCount: 7,
    distanceKm: 5.1,
    rating: 4.2,
    startingPrice: 35,
    href: "/provider-details/pestguard-solutions",
  },
  {
    id: "provider-8",
    name: "CoolAir HVAC Services",
    avatar: "https://placehold.co/48x48",
    banner: "https://placehold.co/384x176",
    serviceCount: 11,
    distanceKm: 2.3,
    rating: 4.6,
    startingPrice: 80,
    href: "/provider-details/coolair-hvac-services",
    verified: true,
  },
  // {
  //   id: "provider-9",
  //   name: "PaintPro Studio",
  //   avatar: "https://placehold.co/48x48",
  //   banner: "https://placehold.co/384x176",
  //   serviceCount: 13,
  //   distanceKm: 4.2,
  //   rating: 4.7,
  //   startingPrice: 65,
  //   href: "/provider-details/paintpro-studio",
  // },
  // {
  //   id: "provider-10",
  //   name: "ShieldLock Security",
  //   avatar: "https://placehold.co/48x48",
  //   banner: "https://placehold.co/384x176",
  //   serviceCount: 5,
  //   distanceKm: 1.8,
  //   rating: 4.3,
  //   startingPrice: 50,
  //   href: "/provider-details/shieldlock-security",
  // },
];
