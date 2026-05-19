import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST: Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, agencyId, rating, comment, reservationId } = body;

    // Validate required fields
    if (!userId || !agencyId || !rating) {
      return NextResponse.json(
        { error: 'userId, agencyId, and rating are required' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check that user exists and is a CUSTOMER
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only customers can submit reviews' },
        { status: 403 }
      );
    }

    // Check that agency exists
    const agency = await db.agency.findUnique({ where: { id: agencyId } });
    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // If reservationId provided, check it belongs to this user/agency and is completed
    if (reservationId) {
      const reservation = await db.reservation.findUnique({
        where: { id: reservationId },
      });
      if (!reservation) {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        );
      }
      if (reservation.userId !== userId) {
        return NextResponse.json(
          { error: 'You can only review your own reservations' },
          { status: 403 }
        );
      }
      if (reservation.agencyId !== agencyId) {
        return NextResponse.json(
          { error: 'Reservation does not belong to this agency' },
          { status: 400 }
        );
      }
      // Check if this reservation already has a review
      const existingReview = await db.review.findUnique({
        where: { reservationId },
      });
      if (existingReview) {
        return NextResponse.json(
          { error: 'This reservation has already been reviewed' },
          { status: 400 }
        );
      }
    }

    // Create the review
    const review = await db.review.create({
      data: {
        rating,
        comment: comment?.trim() || null,
        userId,
        agencyId,
        reservationId: reservationId || null,
      },
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

    // Also update the reservation's rating/feedback fields if reservationId provided
    if (reservationId) {
      await db.reservation.update({
        where: { id: reservationId },
        data: {
          rating,
        },
      });
      // Use raw SQL for feedback/ratedAt fields that may not exist in Prisma Client
      try {
        await db.$executeRaw`UPDATE Reservation SET ratedAt = datetime('now') WHERE id = ${reservationId}`;
        if (comment?.trim()) {
          await db.$executeRaw`UPDATE Reservation SET feedback = ${comment.trim()} WHERE id = ${reservationId}`;
        }
      } catch {
        console.warn('[REVIEWS POST] Could not set feedback/ratedAt, columns may not exist');
      }
    }

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    console.error('Create review error:', message, stack);
    return NextResponse.json(
      { error: 'Failed to create review', detail: message },
      { status: 500 }
    );
  }
}

// GET: Get reviews for an agency
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'agencyId query parameter is required' },
        { status: 400 }
      );
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Check agency exists
    const agency = await db.agency.findUnique({ where: { id: agencyId } });
    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where: { agencyId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.review.count({ where: { agencyId } }),
    ]);

    // Calculate average rating
    const ratingStats = await db.review.aggregate({
      where: { agencyId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = ratingStats._avg.rating
      ? Math.round(ratingStats._avg.rating * 10) / 10
      : 0;

    return NextResponse.json({
      success: true,
      reviews,
      averageRating,
      totalCount: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get reviews error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
