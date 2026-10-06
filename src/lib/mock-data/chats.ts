import type { BookingStatusKey } from "@/lib/helpers";

export interface ChatMessage {
  id: string;
  from: "me" | "provider";
  text: string;
  date: string;
}

export interface ChatConversation {
  id: string;
  providerName: string;
  avatar: string;
  lastMessage: string;
  timeLabel: string;
  unreadCount?: number;
  subtitle: string;
  /** Present for booking-linked chats — list row and detail header show "ID:{bookingId} · {label for bookingStatus}" instead of lastMessage/subtitle. */
  bookingId?: string;
  bookingStatus?: BookingStatusKey;
  messages: ChatMessage[];
}

const sharedMessages: ChatMessage[] = [
  { id: "m1", from: "me", text: "Hello!!", date: "09/02/2026" },
  { id: "m2", from: "me", text: "I am not able to book any services. why?", date: "09/02/2026" },
  {
    id: "m3",
    from: "provider",
    text: "We will solve you problem as soon as possible. Can you please check and try reinstalling the app?",
    date: "09/02/2026",
  },
  { id: "m4", from: "provider", text: "Sure, let me try and get back to you.", date: "09/02/2026" },
  { id: "m5", from: "me", text: "Okay", date: "09/02/2026" },
];

export const enquiryChats: ChatConversation[] = [
  {
    id: "enquiry-1",
    providerName: "Plumbhelp pvt Ltd",
    avatar: "https://placehold.co/48x48",
    lastMessage: "Hello! I had some query regarding your service.",
    timeLabel: "2 Days Ago",
    unreadCount: 1,
    subtitle: "Pre-Booking Enquiry",
    messages: sharedMessages,
  },
  {
    id: "enquiry-2",
    providerName: "CleanPro Services",
    avatar: "https://placehold.co/48x48",
    lastMessage: "Sure, we can schedule that for tomorrow.",
    timeLabel: "3 Days Ago",
    subtitle: "Pre-Booking Enquiry",
    messages: sharedMessages,
  },
  {
    id: "enquiry-3",
    providerName: "Elite Electricians",
    avatar: "https://placehold.co/48x48",
    lastMessage: "Thanks for reaching out, how can we help?",
    timeLabel: "5 Days Ago",
    subtitle: "Pre-Booking Enquiry",
    messages: sharedMessages,
  },
];

/** Customer Support conversation — reached via /chats/admin, not listed under either tab. */
export const supportConversation: ChatConversation = {
  id: "admin",
  providerName: "Customer Support",
  avatar: "https://placehold.co/48x48",
  lastMessage: "How can we help you today?",
  timeLabel: "Just now",
  subtitle: "Support Team",
  messages: [{ id: "m1", from: "provider", text: "How can we help you today?", date: "09/02/2026" }],
};

export const bookingChats: ChatConversation[] = [
  {
    id: "booking-1",
    providerName: "WRTeam Home Repairs",
    avatar: "https://placehold.co/48x48",
    lastMessage: "Your technician is on the way.",
    timeLabel: "2 Days Ago",
    unreadCount: 1,
    subtitle: "Booking #2453620",
    bookingId: "2453620",
    bookingStatus: "onTheWay",
    messages: sharedMessages,
  },
  {
    id: "booking-2",
    providerName: "Shine Beauty Salon",
    avatar: "https://placehold.co/48x48",
    lastMessage: "Your appointment is confirmed for 4 PM.",
    timeLabel: "4 Days Ago",
    subtitle: "Booking #2453701",
    bookingId: "2453701",
    bookingStatus: "completed",
    messages: sharedMessages,
  },
];
