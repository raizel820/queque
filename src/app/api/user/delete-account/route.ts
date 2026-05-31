import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userId = user.id

    // Prevent admin self-deletion
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin accounts cannot be deleted' },
        { status: 403 }
      )
    }

    // Check user exists
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
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
      if (dbUser.role === 'AGENCY_OWNER') {
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
      if (dbUser.role === 'AGENCY_STAFF') {
        await tx.agencyStaff.deleteMany({ where: { userId } })
      }

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    return NextResponse.json({ success: true, message: 'Account deleted successfully' })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
