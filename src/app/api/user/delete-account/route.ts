import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, agencyId: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin self-deletion
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin accounts cannot be deleted' },
        { status: 403 }
      )
    }

    // Delete all related data for this user in proper order
    await db.auditLog.deleteMany({ where: { userId } })
    await db.notification.deleteMany({ where: { userId } })
    await db.smsPurchase.deleteMany({ where: { userId } })
    await db.favorite.deleteMany({ where: { userId } })
    await db.transaction.updateMany({
      where: { reviewedBy: userId },
      data: { reviewedBy: null },
    })
    await db.reservation.deleteMany({ where: { userId } })

    // If agency owner, handle agency cleanup
    if (user.role === 'AGENCY_OWNER' && user.agencyId) {
      await db.agencyStaff.deleteMany({ where: { agencyId: user.agencyId } })
      await db.reservation.deleteMany({ where: { agencyId: user.agencyId } })
      await db.service.deleteMany({ where: { agencyId: user.agencyId } })
      await db.queueSettings.deleteMany({ where: { agencyId: user.agencyId } })
      await db.transaction.deleteMany({ where: { agencyId: user.agencyId } })
      await db.favorite.deleteMany({ where: { agencyId: user.agencyId } })
      await db.agency.delete({ where: { id: user.agencyId } })
    }

    await db.agencyStaff.deleteMany({ where: { userId } })
    await db.agency.deleteMany({ where: { ownerId: userId } })
    await db.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true, message: 'Account deleted successfully' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Delete account error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
