import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH: Update a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, comment, userId } = body;

    // Find the review
    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only the author can update
    if (userId && review.userId !== userId) {
      return NextResponse.json(
        { error: 'Only the review author can update it' },
        { status: 403 }
      );
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

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
    console.error('Update review error:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');

    // Find the review
    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only the author or an admin can delete
    const isAuthor = userId && review.userId === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the review author or an admin can delete it' },
        { status: 403 }
      );
    }

    await db.review.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
