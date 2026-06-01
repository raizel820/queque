import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireResourceOwnership, requireAdmin, authErrorResponse } from '@/lib/auth-guard';
import { validateBody, createReviewSchema } from '@/lib/validations';

// PATCH: Update a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(createReviewSchema.partial(), body);
    if (validation.error) return validation.error;

    const { rating, comment } = validation.data;

    // Find the review
    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Verify ownership via requireResourceOwnership
    await requireResourceOwnership(request, review.userId);

    const updateData: Record<string, unknown> = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment?.trim() || null;

    const updated = await db.review.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Also update the reservation's rating/feedback if linked
    if (review.reservationId) {
      if (rating !== undefined) {
        await db.reservation.update({
          where: { id: review.reservationId },
          data: { rating },
        });
      }
      // Use raw SQL for feedback field that may not exist in Prisma Client
      if (comment !== undefined) {
        try {
          await db.$executeRaw`UPDATE Reservation SET feedback = ${comment?.trim() || null} WHERE id = ${review.reservationId}`;
        } catch {
          console.warn('[REVIEWS PATCH] Could not set feedback, column may not exist');
        }
      }
    }

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// DELETE: Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the review
    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only the author or a SUPER_ADMIN can delete
    try {
      await requireResourceOwnership(request, review.userId);
    } catch {
      // Not the owner — check if SUPER_ADMIN
      await requireAdmin(request);
    }

    await db.review.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
