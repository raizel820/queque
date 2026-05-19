import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, reason, reviewedBy } = body;

    const transaction = await db.transaction.findUnique({ where: { id } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Transaction already ${transaction.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // Validate reviewedBy is a real user ID if provided
    let validReviewedBy: string | null = null;
    if (reviewedBy) {
      const reviewer = await db.user.findUnique({ where: { id: reviewedBy } });
      if (reviewer) {
        validReviewedBy = reviewedBy;
      }
    }

    const updated = await db.transaction.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: validReviewedBy,
        reviewedAt: new Date(),
        rejectionReason: action === 'reject' ? reason : null,
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            customCode: true,
            subscriptionTier: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (action === 'approve') {
      await db.agency.update({
        where: { id: transaction.agencyId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionTier: transaction.plan,
        },
      });
    } else {
      // Rejected - reset agency subscription status
      await db.agency.update({
        where: { id: transaction.agencyId },
        data: {
          subscriptionStatus: 'INACTIVE',
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId: validReviewedBy,
        action: action === 'approve' ? 'PAYMENT_APPROVE' : 'PAYMENT_REJECT',
        entityType: 'TRANSACTION',
        entityId: id,
        details: JSON.stringify({ plan: transaction.plan, amount: transaction.amount, reason }),
      },
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    console.error('Transaction review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
