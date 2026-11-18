'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { RestroomFormValues, ReviewStatus } from '@/types/admin';

export async function updateReviewStatusAction(reviewId: number, status: ReviewStatus) {
  await prisma.review.update({
    where: { id: reviewId },
    data: { status },
  });
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteReviewAction(reviewId: number) {
  await prisma.review.delete({
    where: { id: reviewId },
  });
  revalidatePath('/admin');
  return { ok: true };
}

export async function saveRestroomAction(values: RestroomFormValues) {
  const payload = {
    building: values.building,
    floor: values.floor,
    roomNumber: values.roomNumber || null,
    type: values.type,
    stallCount: values.stallCount,
    lastRenovated: values.lastRenovated ? Number(values.lastRenovated) : null,
    isAccessible: values.isAccessible,
    amenities: values.amenities,
    notes: values.notes || null,
  };

  if (values.id) {
    await prisma.bathroom.update({
      where: { id: values.id },
      data: payload,
    });
  } else {
    await prisma.bathroom.create({
      data: payload,
    });
  }

  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteRestroomAction(restroomId: number) {
  await prisma.bathroom.delete({
    where: { id: restroomId },
  });
  revalidatePath('/admin');
  return { ok: true };
}