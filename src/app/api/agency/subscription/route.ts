import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get('agencyId');

    let agency;
    if (agencyId) {
      agency = await db.agency.findUnique({ where: { id: agencyId } });
    } else {
      agency = await db.agency.findFirst({ where: { isActive: true } });
    }

    if (!agency) return NextResponse.json({ currentPlan: 'BASIC', status: 'INACTIVE' });

    const transactions = await db.transaction.findMany({
      where: { agencyId: agency.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      currentPlan: agency.subscriptionTier,
      status: agency.subscriptionStatus,
      recentTransactions: transactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        plan: tx.plan,
        method: tx.paymentMethod,
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
