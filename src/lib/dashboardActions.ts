// src/lib/dashboardActions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

async function getUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new Error(`User not found for email: ${email}`);
  }
  return user;
}

export async function toggleFavoriteAction(userEmail: string, bathroomId: number) {
  const user = await getUserByEmail(userEmail);

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_bathroomId: {
        userId: user.id,
        bathroomId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.favorite.create({
      data: {
        userId: user.id,
        bathroomId,
      },
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/');
}

export async function createConditionReportAction(
  userEmail: string,
  input: {
    bathroomId: number;
    condition: string;
    note?: string;
  },
) {
  const user = await getUserByEmail(userEmail);

  await prisma.conditionReport.create({
    data: {
      userId: user.id,
      bathroomId: input.bathroomId,
      condition: input.condition,
      note: input.note?.trim() || null,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/');
}

export async function deleteConditionReportAction(userEmail: string, reportId: number) {
  const user = await getUserByEmail(userEmail);

  await prisma.conditionReport.deleteMany({
    where: {
      id: reportId,
      userId: user.id,
    },
  });

  revalidatePath('/dashboard');
}

export async function createReviewAction(
  userEmail: string,
  input: {
    bathroomId: number;
    overallScore: number;
    cleanliness: number;
    odor: number;
    conditionTags: string[];
    comment?: string;
  },
) {
  const user = await getUserByEmail(userEmail);

  await prisma.review.create({
    data: {
      userId: user.id,
      bathroomId: input.bathroomId,
      overallScore: input.overallScore,
      cleanliness: input.cleanliness,
      odor: input.odor,
      conditionTags: input.conditionTags,
      comment: input.comment?.trim() || null,
      status: 'APPROVED',
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/admin');
}

export async function deleteReviewAction(userEmail: string, reviewId: number) {
  const user = await getUserByEmail(userEmail);

  await prisma.review.deleteMany({
    where: {
      id: reviewId,
      userId: user.id,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/admin');
}

export async function submitBathroomRequestAction(
  userEmail: string,
  input: {
    requestType: 'NEW_BATHROOM' | 'CORRECTION';
    bathroomId?: number | null;
    building: string;
    floor: string;
    roomNumber?: string;
    type: string;
    stallCount: number;
    lastRenovated?: number | null;
    isAccessible: boolean;
    amenities: string[];
    notes?: string;
  },
) {
  const user = await getUserByEmail(userEmail);

  await prisma.bathroomRequest.create({
    data: {
      userId: user.id,
      requestType: input.requestType,
      bathroomId: input.requestType === 'CORRECTION' ? input.bathroomId ?? null : null,
      building: input.building.trim(),
      floor: input.floor.trim(),
      roomNumber: input.roomNumber?.trim() || null,
      type: input.type,
      stallCount: Math.max(1, Number(input.stallCount) || 1),
      lastRenovated: input.lastRenovated || null,
      isAccessible: input.isAccessible,
      amenities: input.amenities,
      notes: input.notes?.trim() || null,
      status: 'PENDING',
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/admin');
}