export type ReviewStatus = 'PENDING' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
export type RequestStatus = 'PENDING' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
export type BathroomRequestType = 'NEW_BATHROOM' | 'CORRECTION';

export const UH_MANOA_BUILDINGS = [
  'Hamilton Library',
  'Sinclair Library',
  'Campus Center',
  'Paradise Palms Cafe',
  'POST Building',
  'Keller Hall',
  'Bilger Hall',
  'Holmes Hall',
  'Sakamaki Hall',
  'Queen Liliʻuokalani Center (QLCSS)',
  'Shidler College of Business',
  'Art Building',
];

export interface AdminRestroom {
  id: number;
  building: string;
  floor: string;
  roomNumber: string;
  type: 'Men' | 'Women' | 'All-Gender / Single-Stall' | 'Multi-Stall (Men & Women)';
  stallCount: number;
  lastRenovated: number | null;
  isAccessible: boolean;
  amenities: string[];
  notes: string;
  avgRating: number;
  reviewCount: number;
}

export interface AdminReview {
  id: number;
  restroomId: number;
  restroomLabel: string;
  userEmail: string;
  overallScore: number;
  cleanliness: number;
  odor: number;
  conditionTags: string[];
  comment: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface AdminBathroomRequest {
  id: number;
  requestType: BathroomRequestType;
  bathroomId: number | null;
  building: string;
  floor: string;
  roomNumber: string;
  type: AdminRestroom['type'];
  stallCount: number;
  lastRenovated: number | null;
  isAccessible: boolean;
  amenities: string[];
  notes: string;
  status: RequestStatus;
  userEmail: string;
  createdAt: string;
}

export interface AdminUserAccount {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  isSuspended: boolean;
  reviewCount: number;
  reportCount: number;
  requestCount: number;
}

export interface RestroomFormValues {
  id?: number;
  building: string;
  floor: string;
  roomNumber: string;
  type: AdminRestroom['type'];
  stallCount: number;
  lastRenovated: string;
  isAccessible: boolean;
  amenities: string[];
  notes: string;
}