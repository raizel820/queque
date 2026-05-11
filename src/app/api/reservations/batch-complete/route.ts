import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationIds } = body as { reservationIds?: string[] };

    if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
      return NextResponse.json(
        { error: 'reservationIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (reservationIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 reservations per batch' },
        { status: 400 }
      );
    }

    const results = await db.reservation.updateMany({
      where: {
        id: { in: reservationIds },
        status: { in: ['WAITING', 'CALLED'] },
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: results.count,
    });
  } catch (error) {
    console.error('Batch complete error:', error);
    return NextResponse.json(
      { error: 'Failed to complete reservations' },
      { status: 500 }
    );
  }
}
