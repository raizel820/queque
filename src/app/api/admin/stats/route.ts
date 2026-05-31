import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Run all queries in parallel for performance
    const [
      totalAgencies,
      activeQueues,
      todayReservations,
      totalRevenue,
      pendingTransactions,
      totalUsers,
      totalReservations,
    ] = await Promise.all([
      // Total agencies
      db.agency.count({
        where: { isActive: true },
      }),

      // Active queues (agencies with isQueueOpen and not paused)
      db.queueSettings.count({
        where: { isPaused: false },
      }),

      // Today's reservations
      db.reservation.count({
        where: {
          joinedAt: { gte: today },
        },
      }),

      // Total revenue (approved transactions)
      db.transaction.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),

      // Pending transactions count
      db.transaction.count({
        where: { status: 'PENDING' },
      }),

      // Total users
      db.user.count(),

      // Total reservations
      db.reservation.count(),
    ])

    // Get recent reservations for today
    const recentReservations = await db.reservation.findMany({
      where: {
        joinedAt: { gte: today },
      },
      orderBy: { joinedAt: 'desc' },
      take: 5,
      include: {
        agency: {
          select: { name: true },
        },
        service: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalAgencies,
        activeQueues,
        todayReservations,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingTransactions,
        totalUsers,
        totalReservations,
        recentReservations,
      },
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
