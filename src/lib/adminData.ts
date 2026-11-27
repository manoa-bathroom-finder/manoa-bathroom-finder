import { prisma } from '@/lib/prisma';
import {
  AdminBathroomRequest,
  AdminRestroom,
  AdminReview,
  AdminUserAccount,
  BathroomRequestType,
  RequestStatus,
  ReviewStatus,
} from '@/types/admin';

export async function getAdminDashboardData(): Promise<{
  restrooms: AdminRestroom[];
  reviews: AdminReview[];
  requests: AdminBathroomRequest[];
  users: AdminUserAccount[];
}> {
  const [dbBathrooms, dbReviews, dbRequests, dbUsers] = await Promise.all([
    prisma.bathroom.findMany({
      include: {
        reviews: {
          where: { status: 'APPROVED' },
          select: { overallScore: true },
        },
      },
      orderBy: [{ building: 'asc' }, { floor: 'asc' }],
    }),
    prisma.review.findMany({
      include: {
        user: { select: { email: true } },
        bathroom: { select: { building: true, floor: true, roomNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bathroomRequest.findMany({
      include: {
        user: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isSuspended: true,
        _count: {
          select: {
            reviews: true,
            conditionReports: true,
            bathroomRequests: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    }),
  ]);

  const restrooms: AdminRestroom[] = dbBathrooms.map((b) => {
    const count = b.reviews.length;
    const avg =
      count > 0 ? b.reviews.reduce((sum, r) => sum + r.overallScore, 0) / count : 0;

    return {
      id: b.id,
      building: b.building,
      floor: b.floor,
      roomNumber: b.roomNumber ?? '',
      type: b.type as AdminRestroom['type'],
      stallCount: b.stallCount,
      lastRenovated: b.lastRenovated,
      isAccessible: b.isAccessible,
      amenities: b.amenities,
      notes: b.notes ?? '',
      avgRating: avg,
      reviewCount: count,
    };
  });

  const reviews: AdminReview[] = dbReviews.map((r) => ({
    id: r.id,
    restroomId: r.bathroomId,
    restroomLabel: `${r.bathroom.building} — Floor ${r.bathroom.floor}${
      r.bathroom.roomNumber ? ` (Rm ${r.bathroom.roomNumber})` : ''
    }`,
    userEmail: r.user.email,
    overallScore: r.overallScore,
    cleanliness: r.cleanliness,
    odor: r.odor,
    conditionTags: r.conditionTags,
    comment: r.comment ?? '',
    status: r.status as ReviewStatus,
    createdAt: r.createdAt.toLocaleDateString(),
  }));

  const requests: AdminBathroomRequest[] = dbRequests.map((req) => ({
    id: req.id,
    requestType: req.requestType as BathroomRequestType,
    bathroomId: req.bathroomId,
    building: req.building,
    floor: req.floor,
    roomNumber: req.roomNumber ?? '',
    type: req.type as AdminRestroom['type'],
    stallCount: req.stallCount,
    lastRenovated: req.lastRenovated,
    isAccessible: req.isAccessible,
    amenities: req.amenities,
    notes: req.notes ?? '',
    status: req.status as RequestStatus,
    userEmail: req.user.email,
    createdAt: req.createdAt.toLocaleDateString(),
  }));

  const users: AdminUserAccount[] = dbUsers.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    isSuspended: u.isSuspended,
    reviewCount: u._count.reviews,
    reportCount: u._count.conditionReports,
    requestCount: u._count.bathroomRequests,
  }));

  return { restrooms, reviews, requests, users };
}