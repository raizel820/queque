import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const plan = formData.get('plan') as string;
    const method = formData.get('method') as string;

    const agency = await db.agency.findFirst({ where: { isActive: true } });
    if (!agency) return NextResponse.json({ error: 'No agency found' }, { status: 404 });

    const amount = plan === 'PREMIUM' ? 3000 : 2000;
    const receiptUrl = null; // File upload not yet implemented

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
    console.error('Payment submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
