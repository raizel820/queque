import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireResourceOwnership, authErrorResponse } from '@/lib/auth-guard';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, feedback, notes } = body;

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

    // Verify user owns the reservation (strictly, no agency override for rating)
    await requireResourceOwnership(request, reservation.userId);

    // Check not already rated
    if (reservation.rating) {
      return NextResponse.json({ error: 'Reservation already rated' }, { status: 400 });
    }

    // Update reservation with rating using standard fields
    await db.reservation.update({
      where: { id },
      data: {
        rating,
      },
    });

    // Use raw SQL for feedback/ratedAt fields that may not exist in Prisma Client
    const feedbackText = (feedback || notes || '').trim();
    try {
      await db.$executeRaw`UPDATE Reservation SET ratedAt = datetime('now') WHERE id = ${id}`;
      if (feedbackText) {
        await db.$executeRaw`UPDATE Reservation SET feedback = ${feedbackText} WHERE id = ${id}`;
      }
    } catch {
      // Fields may not exist in older Prisma Client, that's OK
      console.warn('[RATE] Could not set feedback/ratedAt, columns may not exist in Prisma Client');
    }

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
      rating,
      feedback: feedbackText || null,
      ratedAt: new Date().toISOString(),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
