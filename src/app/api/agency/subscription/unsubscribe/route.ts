import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agencyId: agencyIdParam } = body;

    let agencyId: string | null;
    if (agencyIdParam) {
      await requireAgencyAccess(req, agencyIdParam);
      agencyId = agencyIdParam;
    } else {
      const user = await requireAuth(req);
      agencyId = user.agencyId || await resolveUserAgencyId(user);
    }

    if (!agencyId) {
      return NextResponse.json({ error: 'No agency found' }, { status: 404 });
    }

    const agency = await db.agency.findUnique({ where: { id: agencyId } });
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
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/subscription/unsubscribe] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
