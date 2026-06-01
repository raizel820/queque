import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [totalAgencies, totalCustomers, totalReservations, activeQueues] = await Promise.all([
      db.agency.count({ where: { isActive: true } }),
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.reservation.count(),
      db.agency.count({ where: { isQueueOpen: true } }),
    ])

    return NextResponse.json({
      totalAgencies,
      totalCustomers,
      totalReservations,
      activeQueues,
    })
  } catch (error: unknown) {
    console.error('[STATS] Error fetching public stats:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: message },
      { status: 500 }
    )
  }
}
