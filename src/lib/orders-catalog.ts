import { format, parse } from "date-fns";
import type { BookingStatusKey } from "@/lib/helpers";

export function formatBookingDate(dateString: string): string {
  const parsed = parse(dateString, "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? dateString : format(parsed, "dd/MM/yyyy");
}

/** Booking start/end times come back as "HH:mm:ss" with a trailing "Z" — that Z is a real UTC
 * marker (verified against the API: a booking made for 09:10 AM IST comes back as "03:40:00Z"),
 * so it must be converted to the viewer's local time, not stripped and read as a literal clock
 * time. Pass the booking's own "yyyy-MM-dd" date so the UTC instant resolves unambiguously
 * (date without a matching date is combined with today's date as a best-effort fallback, which
 * is only wrong right around a UTC day boundary). */
export function formatBookingTime(rawTime: string, dateString?: string): string {
  if (rawTime.endsWith("Z")) {
    const isoDate = dateString ?? format(new Date(), "yyyy-MM-dd");
    const utcInstant = new Date(`${isoDate}T${rawTime}`);
    if (!Number.isNaN(utcInstant.getTime())) return format(utcInstant, "hh:mm a");
  }
  const clean = rawTime.replace(/Z$/, "");
  const parsed = parse(clean, "HH:mm:ss", new Date());
  return Number.isNaN(parsed.getTime()) ? rawTime : format(parsed, "hh:mm a");
}

const RAW_STATUS_TO_KEY: Record<string, BookingStatusKey> = {
  awaiting: "awaiting",
  confirmed: "confirmed",
  completed: "completed",
  rescheduled: "rescheduled",
  cancelled: "cancelled",
  canceled: "cancelled",
  booking_ended: "bookingEnded",
  bookingended: "bookingEnded",
  started: "started",
  on_the_way: "onTheWay",
  ontheway: "onTheWay",
  arrived: "arrived",
};

/** Maps the backend's raw status string to the app's canonical BookingStatusKey, or null if unrecognized. */
export function toBookingStatusKey(rawStatus: string): BookingStatusKey | null {
  return RAW_STATUS_TO_KEY[rawStatus.trim().toLowerCase()] ?? null;
}

// ---------------------------------------------------------------------------
// get_all_bookings — bucketed list (General Bookings page)
// ---------------------------------------------------------------------------

export interface BookingListProviderApi {
  provider_id: number;
  company_name: string;
  is_provider_verified: number;
  /** Field name as documented, despite reading like a typo of post_booking_chat. */
  post_booking_allowed: number;
  /** "" when the provider has no uploaded profile image — no placeholder is returned. */
  profile_image: string;
}

export interface BookingListItemApi {
  id: number;
  status: string;
  start_date: string;
  start_time: string;
  service_name: string;
  other_services_count: number;
  final_total: number;
  provider: BookingListProviderApi;
}

export interface BookingBucketsApi {
  ongoing_bookings: BookingListItemApi[];
  upcoming_bookings: BookingListItemApi[];
  completed_bookings: BookingListItemApi[];
  cancelled_bookings: BookingListItemApi[];
}

export interface AllBookingsResponse {
  error: boolean;
  message: string;
  data: BookingBucketsApi;
  code: number;
}

export interface BookingCardData {
  id: number;
  providerId: number;
  title: string;
  extraCount: number;
  image: string;
  companyName: string;
  providerVerified: boolean;
  statusKey: BookingStatusKey | null;
  rawStatusLabel: string;
  dateOfService: string;
  startingTime: string;
  total: number;
  chatAllowed: boolean;
}

export function toBookingCardData(booking: BookingListItemApi): BookingCardData {
  return {
    id: booking.id,
    providerId: booking.provider.provider_id,
    title: booking.service_name,
    extraCount: booking.other_services_count,
    image: booking.provider.profile_image,
    companyName: booking.provider.company_name,
    providerVerified: booking.provider.is_provider_verified === 1,
    statusKey: toBookingStatusKey(booking.status),
    rawStatusLabel: booking.status,
    dateOfService: booking.start_date,
    startingTime: booking.start_time,
    total: booking.final_total,
    chatAllowed: booking.provider.post_booking_allowed === 1,
  };
}

// ---------------------------------------------------------------------------
// get_booking_details — single booking (Booking Details page)
// ---------------------------------------------------------------------------

export interface BookingDetailServiceApi {
  service_id: number;
  title: string;
  category_name: string;
  quantity: number;
  price: number;
  image: string;
  rating_id: number | null;
  rating: number | null;
  review: string | null;
  review_images: string[];
}

export interface BookingStatusTimelineEntryApi {
  status: string;
  timestamp: string;
}

export interface BookingDetailProviderApi {
  provider_id: number;
  company_name: string;
  profile_image: string;
  average_rating: number;
  distance: number;
  post_booking_chat: number;
  is_verified: number;
  country_code: string;
  phone: string;
  latitude: number;
  longitude: number;
  advance_booking_days: number;
}

export interface BookingDetailHandymanApi {
  id: number;
  username: string;
  profile_image: string;
  is_lead: number;
  rating_id: number | null;
  rating: number | null;
  review: string | null;
  review_images: string[];
}

export interface BookingDetailFeeApi {
  id: number;
  title: string;
  // API sends this as a numeric string (e.g. "30.00") — coerce with Number() before arithmetic.
  calculated_amount: number | string;
}

export interface BookingAdditionalChargeApi {
  name: string;
  // API sends this as a numeric string (e.g. "6000") — coerce with Number() before arithmetic.
  charge: number | string;
}

// Shape not fully documented — read defensively with fallbacks.
export interface BookingCancellationApi {
  reason?: string;
  is_payment_failure?: boolean;
}

export interface BookingDetailApi {
  id: number;
  status: string;
  date: string;
  start_time: string;
  end_time: string;
  booking_type: "at_store" | "at_doorstep";
  address_id: number | null;
  address: string;
  services: BookingDetailServiceApi[];
  service_status_timeline: BookingStatusTimelineEntryApi[];
  is_cancelable: number;
  next_status_available: string[];
  provider: BookingDetailProviderApi;
  assigned_handymen: BookingDetailHandymanApi[];
  total_services_count: number;
  rated_services_count: number;
  rated_handymen_count: number;
  total_handymen_count: number;
  base_total: number;
  visiting_charges: number | null;
  promo_code: string;
  promo_discount: number;
  payment_method: string;
  payment_status: string;
  tax: { tax_type: string; tax_amount: number };
  final_total: number;
  remarks: string;
  custom_job_request: { id: number; provider_bid_note: string; customer_job_description: string } | null;
  fees: BookingDetailFeeApi[];
  additional_charges: BookingAdditionalChargeApi[];
  additional_charges_payment_method: string;
  additional_charges_payment_status: string;
  work_started_proof: string[];
  work_completed_proof: string[];
  cancellation: BookingCancellationApi | null;
  otp: string;
  multiple_days_booking: { multiple_day_date_of_service: string; multiple_day_starting_time: string; multiple_ending_time: string }[];
  is_reorder_allowed: string;
  is_pay_later_allowed: string;
  live_tracking_started: string;
}

export interface BookingDetailResponse {
  error: boolean;
  message: string;
  data: BookingDetailApi | null;
  code: number;
}
