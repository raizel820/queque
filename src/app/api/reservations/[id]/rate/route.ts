import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify reservation exists and is completed
    const reservation = await db.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Can only rate completed reservations' }, { status: 400 });
    }

    if (reservation.rating) {
      return NextResponse.json({ error: 'Reservation already rated' }, { status: 400 });
    }

    // Update the rating
    const updated = await db.reservation.update({
      where: { id },
      data: { rating },
    });

    return NextResponse.json({ success: true, rating: updated.rating });
  } catch (error) {
    console.error('Rate reservation error:', error);
    return NextResponse.json({ error: 'Failed to rate reservation' }, { status: 500 });
  }
}
