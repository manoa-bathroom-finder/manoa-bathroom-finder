import { prisma } from '@/lib/prisma';
import { AdminRestroom, AdminReview, ReviewStatus } from '@/types/admin';


export async function getAdminDashboardData(): Promise<{
  restrooms: AdminRestroom[];
  reviews: AdminReview[];
}> {
  const [dbBathrooms, dbReviews] = await Promise.all([
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
  ]);

  const restrooms: AdminRestroom[] = dbBathrooms.map((b) => {
    const count = b.reviews.length;
    const avg =
      count > 0
        ? b.reviews.reduce((sum, r) => sum + r.overallScore, 0) / count
        : 0;

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

  return { restrooms, reviews };
}