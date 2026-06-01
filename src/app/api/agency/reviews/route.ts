import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgencyAccess, requireAuth, requireResourceOwnership, authErrorResponse } from '@/lib/auth-guard';

// ─── GET: List reviews for an agency ────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId is required' }, { status: 400 });
    }

    await requireAgencyAccess(request, agencyId);

    const skip = (page - 1) * limit;

    const [reviews, totalReviews] = await Promise.all([
      db.review.findMany({
        where: { agencyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      db.review.count({ where: { agencyId } }),
    ]);

    // Calculate average rating
    const ratingAggregation = await db.review.aggregate({
      where: { agencyId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Get rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const allRatings = await db.review.findMany({
      where: { agencyId },
      select: { rating: true },
    });
    for (const r of allRatings) {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[r.rating]++;
      }
    }

    const avgRating = ratingAggregation._avg.rating
      ? Math.round(ratingAggregation._avg.rating * 10) / 10
      : 0;

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        replyText: r.replyText,
        repliedAt: r.repliedAt,
        createdAt: r.createdAt,
        user: {
          id: r.user.id,
          fullName: r.user.fullName,
          avatarUrl: r.user.avatarUrl,
        },
      })),
      avgRating,
      totalReviews,
      ratingDistribution,
      hasMore: skip + limit < totalReviews,
    });
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}

// ─── POST: Create or update a review ────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyId, rating, comment } = body;

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId is required' }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Derive userId from session, never trust client-provided userId
    const user = await requireAuth(request);
    const userId = user.id;

    // Verify agency access for this review
    await requireAgencyAccess(request, agencyId);

    // Check if user already reviewed this agency
    const existing = await db.review.findUnique({
      where: { userId_agencyId: { userId, agencyId } },
    });

    let review;
    if (existing) {
      // Update existing review
      review = await db.review.update({
        where: { id: existing.id },
        data: {
          rating,
          comment: comment || null,
        },
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      });
    } else {
      // Create new review
      review = await db.review.create({
        data: {
          userId,
          agencyId,
          rating,
          comment: comment || null,
        },
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      });
    }

    return NextResponse.json({
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          fullName: review.user.fullName,
          avatarUrl: review.user.avatarUrl,
        },
      },
      updated: !!existing,
    });
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}

// ─── DELETE: Delete a review ────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Use session-derived user to verify ownership instead of trusting client userId
    await requireResourceOwnership(request, review.userId);

    await db.review.delete({ where: { id: reviewId } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
