import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { agencyId } = body

    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'agencyId is required' },
        { status: 400 }
      )
    }

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

    return NextResponse.json({
      success: true,
      queueSettings: updatedSettings,
    })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
