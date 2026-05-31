import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  try {
    const { agencyId } = await req.json();

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 });
    }

    await requireAgencyAccess(req, agencyId);

    // Check agency has an active subscription
    const agencyCheck = await db.agency.findUnique({ where: { id: agencyId } });
    if (!agencyCheck) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }
    if (agencyCheck.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'An active subscription is required to use queue features' },
        { status: 403 }
      );
    }

    const queueSettings = await db.queueSettings.findFirst({ where: { agencyId } });
    if (!queueSettings) {
      return NextResponse.json({ error: 'Queue settings not found' }, { status: 404 });
    }

    const newPausedState = !queueSettings.isPaused;

    await db.queueSettings.update({
      where: { id: queueSettings.id },
      data: {
        isPaused: newPausedState,
        pausedAt: newPausedState ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        action: newPausedState ? 'QUEUE_PAUSE' : 'QUEUE_RESUME',
        entityType: 'AGENCY',
        entityId: agencyId,
        details: JSON.stringify({ paused: newPausedState }),
      },
    });

    return NextResponse.json({ success: true, isPaused: newPausedState });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/queue/toggle-pause] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
