import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { agencyId, averageServiceTime, maxActiveReservations, isQueueOpen } = body

    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'agencyId is required' },
        { status: 400 }
      )
    }

    // Verify agency access
    const user = await requireAgencyAccess(request, agencyId)

    // Check agency exists
    const agency = await db.agency.findUnique({ where: { id: agencyId } })
    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (averageServiceTime !== undefined) {
      updateData.averageServiceTime = averageServiceTime
    }
    if (maxActiveReservations !== undefined) {
      updateData.maxActiveReservations = maxActiveReservations
    }
    if (isQueueOpen !== undefined) {
      updateData.isQueueOpen = isQueueOpen
    }

    // Update agency
    const updatedAgency = await db.agency.update({
      where: { id: agencyId },
      data: updateData,
    })

    // Create audit log — use session user.id
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'SETTINGS_UPDATE',
        entityType: 'AGENCY',
        entityId: agencyId,
        details: JSON.stringify({
          averageServiceTime,
          maxActiveReservations,
          isQueueOpen,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      agency: updatedAgency,
    })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
