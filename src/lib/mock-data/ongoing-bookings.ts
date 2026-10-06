import type { BookingStatusKey } from "@/lib/helpers";

export type OngoingBookingStatus = Extract<BookingStatusKey, "arrived" | "onTheWay" | "started">;

export interface OngoingBooking {
  id: string;
  date: string;
  time: string;
  status: OngoingBookingStatus;
  title: string;
  extraCount: number;
  providerName: string;
  providerAvatar: string;
  providerHref: string;
  chatHref?: string;
}
