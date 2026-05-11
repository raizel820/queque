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
      select: { id: true, role: true },
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

    // Delete all related data in a single transaction to ensure consistency
    await db.$transaction(async (tx) => {
      // Clear user's personal data
      await tx.auditLog.deleteMany({ where: { userId } })
      await tx.notification.deleteMany({ where: { userId } })
      await tx.smsPurchase.deleteMany({ where: { userId } })
      await tx.favorite.deleteMany({ where: { userId } })
      await tx.transaction.updateMany({
        where: { reviewedBy: userId },
        data: { reviewedBy: null },
      })
      await tx.reservation.deleteMany({ where: { userId } })

      // If agency owner, find and clean up the entire agency
      if (user.role === 'AGENCY_OWNER') {
        const ownedAgency = await tx.agency.findFirst({
          where: { ownerId: userId },
          select: { id: true },
        })

        if (ownedAgency) {
          const agencyId = ownedAgency.id
          await tx.agencyStaff.deleteMany({ where: { agencyId } })
          await tx.reservation.deleteMany({ where: { agencyId } })
          await tx.service.deleteMany({ where: { agencyId } })
          await tx.queueSettings.deleteMany({ where: { agencyId } })
          await tx.transaction.deleteMany({ where: { agencyId } })
          await tx.favorite.deleteMany({ where: { agencyId } })
          await tx.agency.delete({ where: { id: agencyId } })
        }
      }

      // Remove staff association for agency staff
      if (user.role === 'AGENCY_STAFF') {
        await tx.agencyStaff.deleteMany({ where: { userId } })
      }

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } })
    })

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
