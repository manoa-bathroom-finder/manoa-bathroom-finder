// src/lib/dashboardData.ts

export interface FavoriteBathroom {
  id: number;
  building: string;
  floor: string;
  roomNumber?: string;
  types: string[];
  overallRating: number;
  isAccessible: boolean;
  isRenovated: boolean;
  latestCondition: string;
}

export interface UserReview {
  id: number;
  bathroomLabel: string;
  overallScore: number;
  cleanliness: number;
  odor: number;
  comment: string;
}

export interface UserConditionReport {
  id: number;
  bathroomLabel: string;
  condition: string;
  note?: string;
  createdAt: string;
}

export interface BathroomRequest {
  id: number;
  bathroomLabel: string;
  requestType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface DashboardData {
  user: {
    email: string;
    role: 'USER' | 'ADMIN';
  };
  favorites: FavoriteBathroom[];
  reviews: UserReview[];
  reports: UserConditionReport[];
  requests: BathroomRequest[];
}

export async function getUserDashboardData(email: string): Promise<DashboardData> {
  // TODO: Once Prisma bathroom models are migrated, replace this mock return
  // with `await prisma.user.findUnique({ where: { email }, include: { ... } })`.
  return {
    user: {
      email,
      role: 'USER',
    },
    favorites: [
      {
        id: 1,
        building: 'Hamilton Library',
        floor: '2',
        roomNumber: '204',
        types: ['Men', 'Women', 'Accessible'],
        overallRating: 4.6,
        isAccessible: true,
        isRenovated: true,
        latestCondition: 'Freshly sanitized (25m ago)',
      },
      {
        id: 2,
        building: 'POST Building',
        floor: '3',
        roomNumber: '310',
        types: ['Men', 'Women'],
        overallRating: 4.2,
        isAccessible: true,
        isRenovated: false,
        latestCondition: 'Low paper towels (1h ago)',
      },
    ],
    reviews: [
      {
        id: 101,
        bathroomLabel: 'Hamilton Library — Floor 2',
        overallScore: 5,
        cleanliness: 5,
        odor: 5,
        comment: 'Newly renovated stalls, clean sinks, and well stocked.',
      },
    ],
    reports: [
      {
        id: 201,
        bathroomLabel: 'Campus Center — Floor 1',
        condition: 'Missing Soap',
        note: 'Left dispenser empty near the entrance.',
        createdAt: 'Today at 1:15 PM',
      },
    ],
    requests: [
      {
        id: 301,
        bathroomLabel: 'Keller Hall — Floor 1',
        requestType: 'Add new bathroom location',
        status: 'PENDING',
      },
    ],
  };
}