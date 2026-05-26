import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache, CACHE_TTL } from '@/lib/cache'

export async function GET() {
  try {
    const result = await cache.getOrSet(
      'admin:stats',
      async () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [
          totalAgencies,
          activeQueues,
          todayReservations,
          totalRevenue,
          pendingTransactions,
          totalUsers,
          totalReservations,
        ] = await Promise.all([
          db.agency.count({ where: { isActive: true } }),
          db.queueSettings.count({ where: { isPaused: false } }),
          db.reservation.count({ where: { joinedAt: { gte: today } } }),
          db.transaction.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
          db.transaction.count({ where: { status: 'PENDING' } }),
          db.user.count(),
          db.reservation.count(),
        ])

        const recentReservations = await db.reservation.findMany({
          where: { joinedAt: { gte: today } },
          orderBy: { joinedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            displayNumber: true,
            status: true,
            joinedAt: true,
            agency: { select: { name: true } },
            service: { select: { name: true } },
          },
        })

        return {
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
        }
      },
      CACHE_TTL.MEDIUM // 30 seconds
    )

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
