// src/lib/dashboardData.ts
import { prisma } from '@/lib/prisma'

export interface BathroomOption {
  id: number;
  label: string;
  building: string;
  floor: string;
  roomNumber: string;
  type: string;
  stallCount: number;
  lastRenovated: number | null;
  isAccessible: boolean;
  amenities: string[];
  notes: string;
}

export interface FavoriteBathroom {
  id: number;
  favoriteId: number;
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
  bathroomId: number;
  bathroomLabel: string;
  overallScore: number;
  cleanliness: number;
  odor: number;
  conditionTags: string[];
  comment: string;
  status: 'PENDING' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface UserConditionReport {
  id: number;
  bathroomLabel: string;
  condition: string;
  note?: string;
  createdAt: string;
}

export interface BathroomRequestItem {
  id: number;
  bathroomLabel: string;
  requestType: 'NEW_BATHROOM' | 'CORRECTION';
  details: string;
  status: 'PENDING' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface DashboardData {
  user: {
    id: number | null;
    email: string;
    role: 'USER' | 'ADMIN';
  };
  favorites: FavoriteBathroom[];
  reviews: UserReview[];
  reports: UserConditionReport[];
  requests: BathroomRequestItem[];
  bathrooms: BathroomOption[];
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export async function getUserDashboardData(email: string): Promise<DashboardData> {
  const [user, allBathrooms] = await Promise.all([
    prisma.user.findUnique({
      where: { email },
      include: {
        favorites: {
          orderBy: { createdAt: 'desc' },
          include: {
            bathroom: {
              include: {
                reviews: {
                  where: { status: 'APPROVED' },
                  select: { overallScore: true },
                },
                conditionReports: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            bathroom: {
              select: { building: true, floor: true, roomNumber: true },
            },
          },
        },
        conditionReports: {
          orderBy: { createdAt: 'desc' },
          include: {
            bathroom: {
              select: { building: true, floor: true, roomNumber: true },
            },
          },
        },
        bathroomRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.bathroom.findMany({
      orderBy: [{ building: 'asc' }, { floor: 'asc' }],
    }),
  ]);

  const bathrooms: BathroomOption[] = allBathrooms.map((b) => ({
    id: b.id,
    label: `${b.building} — Floor ${b.floor}${b.roomNumber ? ` (Room ${b.roomNumber})` : ''}`,
    building: b.building,
    floor: b.floor,
    roomNumber: b.roomNumber ?? '',
    type: b.type,
    stallCount: b.stallCount,
    lastRenovated: b.lastRenovated,
    isAccessible: b.isAccessible,
    amenities: b.amenities,
    notes: b.notes ?? '',
  }));

  if (!user) {
    return {
      user: { id: null, email, role: 'USER' },
      favorites: [],
      reviews: [],
      reports: [],
      requests: [],
      bathrooms,
    };
  }

  const favorites: FavoriteBathroom[] = user.favorites.map((fav) => {
    const b = fav.bathroom;
    const approvedCount = b.reviews.length;
    const overallRating =
      approvedCount > 0
        ? b.reviews.reduce((sum, r) => sum + r.overallScore, 0) / approvedCount
        : 0;
    const latest = b.conditionReports[0];

    return {
      id: b.id,
      favoriteId: fav.id,
      building: b.building,
      floor: b.floor,
      roomNumber: b.roomNumber ?? undefined,
      types: [b.type],
      overallRating,
      isAccessible: b.isAccessible,
      isRenovated: Boolean(b.lastRenovated && b.lastRenovated >= 2018),
      latestCondition: latest
        ? `${latest.condition} (${formatTimeAgo(latest.createdAt)})`
        : 'No recent reports',
    };
  });

  const reviews: UserReview[] = user.reviews.map((r) => ({
    id: r.id,
    bathroomId: r.bathroomId,
    bathroomLabel: `${r.bathroom.building} — Floor ${r.bathroom.floor}${
      r.bathroom.roomNumber ? ` (Room ${r.bathroom.roomNumber})` : ''
    }`,
    overallScore: r.overallScore,
    cleanliness: r.cleanliness,
    odor: r.odor,
    conditionTags: r.conditionTags,
    comment: r.comment ?? '',
    status: r.status,
    createdAt: r.createdAt.toLocaleDateString(),
  }));

  const reports: UserConditionReport[] = user.conditionReports.map((rep) => ({
    id: rep.id,
    bathroomLabel: `${rep.bathroom.building} — Floor ${rep.bathroom.floor}${
      rep.bathroom.roomNumber ? ` (Room ${rep.bathroom.roomNumber})` : ''
    }`,
    condition: rep.condition,
    note: rep.note ?? undefined,
    createdAt: formatTimeAgo(rep.createdAt),
  }));

  const requests: BathroomRequestItem[] = user.bathroomRequests.map((req) => ({
    id: req.id,
    bathroomLabel: `${req.building} — Floor ${req.floor}${
      req.roomNumber ? ` (Room ${req.roomNumber})` : ''
    }`,
    requestType: req.requestType,
    details: `${req.type} • ${req.stallCount} stall(s)${req.notes ? ` — ${req.notes}` : ''}`,
    status: req.status,
    createdAt: req.createdAt.toLocaleDateString(),
  }));

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    favorites,
    reviews,
    reports,
    requests,
    bathrooms,
  };
}