export type ReviewStatus = 'PENDING' | 'FLAGGED' | 'APPROVED';

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