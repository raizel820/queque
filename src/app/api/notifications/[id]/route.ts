import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireResourceOwnership, authErrorResponse } from '@/lib/auth-guard'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const notification = await db.notification.findUnique({ where: { id } })
    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    await requireResourceOwnership(request, notification.userId)

    if (notification.isRead) {
      return NextResponse.json({
        success: true,
        notification,
        message: 'Already read',
      })
    }

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true, notification: updated })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const notification = await db.notification.findUnique({ where: { id } })
    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    await requireResourceOwnership(request, notification.userId)

    await db.notification.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
