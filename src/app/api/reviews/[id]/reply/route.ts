import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';

// POST: Add a reply to a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { agencyId, text } = body;

    if (!agencyId || !text?.trim()) {
      return NextResponse.json(
        { error: 'agencyId and text are required' },
        { status: 400 }
      );
    }

    // Verify the user has access to this agency
    await requireAgencyAccess(request, agencyId);

    // Find the review
    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only the agency that received the review can reply
    if (review.agencyId !== agencyId) {
      return NextResponse.json(
        { error: 'Only the reviewed agency can reply' },
        { status: 403 }
      );
    }

    // Update the review with reply
    const updated = await db.review.update({
      where: { id },
      data: {
        replyText: text.trim(),
        repliedAt: new Date(),
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

    return NextResponse.json({ success: true, review: updated });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
