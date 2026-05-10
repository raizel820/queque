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

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updated = await db.transaction.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: reviewedBy || 'admin',
        reviewedAt: new Date(),
        rejectionReason: action === 'reject' ? reason : null,
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
    }

    await db.auditLog.create({
      data: {
        userId: reviewedBy || null,
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
