import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, authErrorResponse } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const agencyId = user.agencyId || await resolveUserAgencyId(user);
    if (!agencyId) {
      return NextResponse.json({ error: 'No agency found' }, { status: 404 });
    }

    const formData = await req.formData();
    const plan = formData.get('plan') as string;
    const method = formData.get('method') as string;
    const receiptUrl = formData.get('receiptUrl') as string | null;

    const agency = await db.agency.findUnique({ where: { id: agencyId } });
    if (!agency) return NextResponse.json({ error: 'No agency found' }, { status: 404 });

    const amount = plan === 'PREMIUM' ? 3000 : 2000;

    const transaction = await db.transaction.create({
      data: {
        agencyId: agency.id,
        amount,
        plan,
        paymentMethod: method,
        receiptUrl,
        status: 'PENDING',
      },
    });

    await db.agency.update({
      where: { id: agency.id },
      data: { subscriptionStatus: 'PENDING' },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/subscription/pay] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
