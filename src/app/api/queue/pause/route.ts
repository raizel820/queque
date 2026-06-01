import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'
import { validateBody } from '@/lib/validations'
import { z } from 'zod'
import { emitQueueEvent, emitKioskEvent } from '@/lib/realtime-emit'

const agencyIdSchema = z.object({
  agencyId: z.string().min(1, 'Agency ID is required'),
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateBody(agencyIdSchema, body)
    if (validation.error) return validation.error

    const { agencyId } = validation.data

    // Verify agency access
    const user = await requireAgencyAccess(request, agencyId)

    // Get or create queue settings
    const queueSettings = await db.queueSettings.findFirst({
      where: { agencyId },
      orderBy: { updatedAt: 'desc' },
    })

    if (!queueSettings) {
      return NextResponse.json(
        { success: false, error: 'No queue settings found for this agency' },
        { status: 404 }
      )
    }

    // Update paused state
    const updatedSettings = await db.queueSettings.update({
      where: { id: queueSettings.id },
      data: {
        isPaused: true,
        pausedAt: new Date(),
      },
    })

    // Create audit log — use session user.id
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'SETTINGS_UPDATE',
        entityType: 'AGENCY',
        entityId: agencyId,
        details: JSON.stringify({ action: 'PAUSE_QUEUE' }),
      },
    })

    // Emit realtime events (fire-and-forget)
    emitQueueEvent('queue:paused', agencyId, {
      action: 'pause',
    })
    emitKioskEvent(agencyId, {
      action: 'queue-paused',
    })

    return NextResponse.json({
      success: true,
      queueSettings: updatedSettings,
    })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
