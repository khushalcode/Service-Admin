export interface PreviousBooking {
  id: string;
  orderId: number;
  isReorderAllowed: boolean;
  date: string;
  time: string;
  rating: number | null;
  title: string;
  providerName: string;
  providerAvatar: string;
  providerHref: string;
}
