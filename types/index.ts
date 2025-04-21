export interface Slot {
  id: string;
  tokenId: string;
  owner: string;
  status: string;
  claimable: string;
}

export interface Property {
  id: string;
  address: string;
  title: string;
  type: string;
  rental_income: string;
  apy: string;
  price: string;
  slotContract: string;
  imageUrl?: string;
  availableSlots?: number;
  totalSlots?: number;
  isActive?: boolean;
}

export interface ClaimableAsset {
  property: string;
  holder: string;
  claimable: string;
}

export interface PendingClaim {
  property: string;
}

export interface ClaimHistory {
  property: string;
  amount: string;
  date: string;
}

export interface User {
  id: string;
  address: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export type City = 'All' | 'Baku' | 'Dubai' | 'Budapest'; 