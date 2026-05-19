import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { agencyId } = await req.json();

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 });
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
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/queue/toggle-pause] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
