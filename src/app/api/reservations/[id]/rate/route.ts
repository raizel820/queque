import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, feedback, userId, notes } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify reservation exists
    const reservation = await db.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Verify reservation status is COMPLETED
    if (reservation.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Can only rate completed reservations' }, { status: 400 });
    }

    // Verify user owns the reservation
    const requestingUserId = userId || reservation.userId;
    if (reservation.userId !== requestingUserId) {
      return NextResponse.json({ error: 'You can only rate your own reservations' }, { status: 403 });
    }

    // Check not already rated
    if (reservation.rating) {
      return NextResponse.json({ error: 'Reservation already rated' }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      rating,
      ratedAt: new Date(),
    };

    // Store feedback in the dedicated feedback field
    const feedbackText = (feedback || notes || '').trim();
    if (feedbackText) {
      updateData.feedback = feedbackText;
    }

    // Update reservation
    const updated = await db.reservation.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: reservation.userId,
        action: 'RATING_SUBMITTED',
        entityType: 'Reservation',
        entityId: reservation.id,
        details: JSON.stringify({ rating, feedback: feedbackText || null }),
      },
    });

    return NextResponse.json({
      success: true,
      rating: updated.rating,
      feedback: updated.feedback,
      ratedAt: updated.ratedAt,
    });
  } catch (error) {
    console.error('Rate reservation error:', error);
    return NextResponse.json({ error: 'Failed to rate reservation' }, { status: 500 });
  }
}
