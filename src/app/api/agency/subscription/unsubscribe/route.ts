import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agencyId } = body;

    let agency;
    if (agencyId) {
      agency = await db.agency.findUnique({ where: { id: agencyId } });
    } else {
      agency = await db.agency.findFirst({ where: { isActive: true } });
    }
    if (!agency) return NextResponse.json({ error: 'No agency found' }, { status: 404 });

    await db.agency.update({
      where: { id: agency.id },
      data: {
        subscriptionStatus: 'INACTIVE',
        subscriptionTier: 'BASIC',
        subscriptionExpiresAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/subscription/unsubscribe] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
