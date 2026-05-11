import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { agencyId, averageServiceTime, maxActiveReservations, isQueueOpen, updatedBy } = body

    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'agencyId is required' },
        { status: 400 }
      )
    }

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

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: updatedBy,
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
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
