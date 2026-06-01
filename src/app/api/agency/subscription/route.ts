import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  try {
    const agencyIdParam = req.nextUrl.searchParams.get('agencyId');

    let agencyId: string | null;
    if (agencyIdParam) {
      await requireAgencyAccess(req, agencyIdParam);
      agencyId = agencyIdParam;
    } else {
      const user = await requireAuth(req);
      agencyId = user.agencyId || await resolveUserAgencyId(user);
    }

    if (!agencyId) return NextResponse.json({ currentPlan: 'BASIC', status: 'INACTIVE' });

    const agency = await db.agency.findUnique({ where: { id: agencyId } });
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
    return authErrorResponse(error)
  }
}
