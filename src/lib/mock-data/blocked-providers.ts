export interface BlockedProvider {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  serviceCount: number;
}

export const blockedProviders: BlockedProvider[] = [
  { id: "provider-1", name: "PlumbService Pvt Ltd", avatar: "https://placehold.co/44x44", rating: 4.5, serviceCount: 10 },
  { id: "provider-2", name: "CleanPro Services", avatar: "https://placehold.co/44x44", rating: 4.2, serviceCount: 8 },
  { id: "provider-3", name: "Elite Electricians", avatar: "https://placehold.co/44x44", rating: 4.7, serviceCount: 14 },
];
