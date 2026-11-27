'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminRestroom, RestroomFormValues, ReviewStatus } from '@/types/admin';

async function requireAdmin() {
  const session = await auth();
  const userWithRole = session?.user as
    | { email?: string; randomKey?: string; role?: string }
    | undefined;
  const role = userWithRole?.randomKey ?? userWithRole?.role;

  if (!session?.user?.email || role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required.');
  }
  return session.user.email;
}

export async function updateReviewStatusAction(reviewId: number, status: ReviewStatus) {
  await requireAdmin();
  await prisma.review.update({
    where: { id: reviewId },
    data: { status },
  });
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteReviewAction(reviewId: number) {
  await requireAdmin();
  await prisma.review.delete({
    where: { id: reviewId },
  });
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function saveRestroomAction(values: RestroomFormValues): Promise<AdminRestroom> {
  await requireAdmin();

  const payload = {
    building: values.building.trim(),
    floor: values.floor.trim(),
    roomNumber: values.roomNumber.trim() || null,
    type: values.type,
    stallCount: Math.max(1, Number(values.stallCount) || 1),
    lastRenovated: values.lastRenovated ? Number(values.lastRenovated) : null,
    isAccessible: values.isAccessible,
    amenities: values.amenities,
    notes: values.notes.trim() || null,
  };

  const saved = values.id
    ? await prisma.bathroom.update({
        where: { id: values.id },
        data: payload,
      })
    : await prisma.bathroom.create({
        data: payload,
      });

  revalidatePath('/admin');
  revalidatePath('/dashboard');

  return {
    id: saved.id,
    building: saved.building,
    floor: saved.floor,
    roomNumber: saved.roomNumber ?? '',
    type: saved.type as AdminRestroom['type'],
    stallCount: saved.stallCount,
    lastRenovated: saved.lastRenovated,
    isAccessible: saved.isAccessible,
    amenities: saved.amenities,
    notes: saved.notes ?? '',
    avgRating: 0,
    reviewCount: 0,
  };
}

export async function deleteRestroomAction(restroomId: number) {
  await requireAdmin();
  await prisma.bathroom.delete({
    where: { id: restroomId },
  });
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function approveBathroomRequestAction(
  requestId: number,
): Promise<{ restroom: AdminRestroom; mode: 'CREATED' | 'UPDATED' }> {
  await requireAdmin();

  const req = await prisma.bathroomRequest.findUnique({
    where: { id: requestId },
  });

  if (!req) {
    throw new Error('Bathroom request not found.');
  }

  const bathroomPayload = {
    building: req.building,
    floor: req.floor,
    roomNumber: req.roomNumber,
    type: req.type,
    stallCount: req.stallCount,
    lastRenovated: req.lastRenovated,
    isAccessible: req.isAccessible,
    amenities: req.amenities,
    notes: req.notes,
  };

  let savedBathroom;
  let mode: 'CREATED' | 'UPDATED' = 'CREATED';

  if (req.requestType === 'CORRECTION' && req.bathroomId) {
    const existing = await prisma.bathroom.findUnique({
      where: { id: req.bathroomId },
    });

    if (existing) {
      savedBathroom = await prisma.bathroom.update({
        where: { id: req.bathroomId },
        data: bathroomPayload,
      });
      mode = 'UPDATED';
    } else {
      savedBathroom = await prisma.bathroom.create({
        data: bathroomPayload,
      });
    }
  } else {
    savedBathroom = await prisma.bathroom.create({
      data: bathroomPayload,
    });
  }

  await prisma.bathroomRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      bathroomId: savedBathroom.id,
    },
  });

  revalidatePath('/admin');
  revalidatePath('/dashboard');

  return {
    mode,
    restroom: {
      id: savedBathroom.id,
      building: savedBathroom.building,
      floor: savedBathroom.floor,
      roomNumber: savedBathroom.roomNumber ?? '',
      type: savedBathroom.type as AdminRestroom['type'],
      stallCount: savedBathroom.stallCount,
      lastRenovated: savedBathroom.lastRenovated,
      isAccessible: savedBathroom.isAccessible,
      amenities: savedBathroom.amenities,
      notes: savedBathroom.notes ?? '',
      avgRating: 0,
      reviewCount: 0,
    },
  };
}

export async function rejectBathroomRequestAction(requestId: number) {
  await requireAdmin();
  await prisma.bathroomRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED' },
  });
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function toggleUserSuspensionAction(userId: number, isSuspended: boolean) {
  const currentAdminEmail = await requireAdmin();

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!targetUser) {
    throw new Error('User account not found.');
  }

  if (targetUser.email === currentAdminEmail) {
    throw new Error('You cannot suspend your own admin account.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isSuspended },
  });

  revalidatePath('/admin');
  return { ok: true };
}