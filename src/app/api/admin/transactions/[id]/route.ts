import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';

const reviewTransactionSchema = z.object({
  action: z.enum(['approve', 'reject'], { errorMap: () => ({ message: 'Action must be "approve" or "reject"' }) }),
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);

    const { id } = await params;
    const body = await req.json();
    const validation = validateBody(reviewTransactionSchema, body);
    if (validation.error) return validation.error;

    const { action, reason } = validation.data;

    const transaction = await db.transaction.findUnique({ where: { id } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Transaction already ${transaction.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updated = await db.transaction.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: admin.id,
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
        userId: admin.id,
        action: action === 'approve' ? 'PAYMENT_APPROVE' : 'PAYMENT_REJECT',
        entityType: 'TRANSACTION',
        entityId: id,
        details: JSON.stringify({ plan: transaction.plan, amount: transaction.amount, reason }),
      },
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}
