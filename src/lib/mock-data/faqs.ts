export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    id: "faq-booking",
    question: "How do I book a service?",
    answer:
      "Simply search for the service you need, select a provider, choose a time slot, and confirm your booking in just a few steps.",
  },
  {
    id: "faq-verified",
    question: "Are the service providers verified?",
    answer:
      "Yes, all professionals go through a verification process and are rated by real customers to ensure quality and reliability.",
  },
  {
    id: "faq-reschedule",
    question: "Can I reschedule or cancel a booking?",
    answer:
      "Yes, you can easily reschedule or cancel your booking from your account, based on the service provider's policy.",
  },
  {
    id: "faq-pricing",
    question: "How is the pricing decided?",
    answer:
      "Pricing is shown upfront before booking. Some services have fixed rates, while others may vary depending on the work required.",
  },
  {
    id: "faq-tools",
    question: "Do I need to provide any tools or materials?",
    answer:
      "Most professionals bring the required tools. If anything specific is needed, it will be mentioned before booking.",
  },
];
