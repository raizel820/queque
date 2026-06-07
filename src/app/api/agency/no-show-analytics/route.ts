import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'

/**
 * GET /api/agency/no-show-analytics?agencyId=XXX&period=30
 * Returns no-show statistics and trends for the agency
 * Query params: agencyId (required), period (optional, default 30 days)
 */
export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get('agencyId')
    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 })
    }

    await requireAgencyAccess(req, agencyId)

    const periodDays = parseInt(req.nextUrl.searchParams.get('period') || '30', 10)
    const periodAgo = new Date()
    periodAgo.setDate(periodAgo.getDate() - periodDays)

    const [totalReservations, noShows, cancelled] = await Promise.all([
      db.reservation.count({
        where: { agencyId, joinedAt: { gte: periodAgo } },
      }),
      db.reservation.count({
        where: { agencyId, status: 'NO_SHOW', joinedAt: { gte: periodAgo } },
      }),
      db.reservation.count({
        where: { agencyId, status: 'CANCELLED', joinedAt: { gte: periodAgo } },
      }),
    ])

    const noShowRate = totalReservations > 0 ? Math.round((noShows / totalReservations) * 100) : 0
    const cancelRate = totalReservations > 0 ? Math.round((cancelled / totalReservations) * 100) : 0

    const dailyStats = await db.$queryRaw<Array<{ date: string; total: number; noShows: number }>>`
      SELECT 
        DATE(joinedAt) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'NO_SHOW' THEN 1 ELSE 0 END) as noShows
      FROM Reservation
      WHERE agencyId = ${agencyId}
        AND joinedAt >= ${periodAgo}
      GROUP BY DATE(joinedAt)
      ORDER BY date ASC
    `

    const serviceStats = await db.$queryRaw<
      Array<{ serviceId: string; serviceName: string; total: number; noShows: number }>
    >`
      SELECT 
        r.serviceId,
        s.name as serviceName,
        COUNT(*) as total,
        SUM(CASE WHEN r.status = 'NO_SHOW' THEN 1 ELSE 0 END) as noShows
      FROM Reservation r
      JOIN Service s ON r.serviceId = s.id
      WHERE r.agencyId = ${agencyId}
        AND r.joinedAt >= ${periodAgo}
      GROUP BY r.serviceId, s.name
      ORDER BY noShows DESC
      LIMIT 10
    `

    const hourlyStats = await db.$queryRaw<Array<{ hour: number; total: number; noShows: number }>>`
      SELECT 
        CAST(strftime('%H', joinedAt) AS INTEGER) as hour,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'NO_SHOW' THEN 1 ELSE 0 END) as noShows
      FROM Reservation
      WHERE agencyId = ${agencyId}
        AND joinedAt >= ${periodAgo}
      GROUP BY hour
      ORDER BY hour ASC
    `

    const reclaimedNoShows = await db.reservation.count({
      where: {
        agencyId,
        status: 'NO_SHOW',
        skippedForNoShow: true,
        reclaimRequestedAt: { not: null },
        joinedAt: { gte: periodAgo },
      },
    })

    return NextResponse.json({
      success: true,
      analytics: {
        summary: {
          totalReservations,
          noShows,
          cancelled,
          noShowRate,
          cancelRate,
          reclaimedNoShows,
          reclaimRate: noShows > 0 ? Math.round((reclaimedNoShows / noShows) * 100) : 0,
        },
        dailyTrend: dailyStats.map((d) => ({
          date: d.date,
          total: Number(d.total),
          noShows: Number(d.noShows),
          rate: Number(d.total) > 0 ? Math.round((Number(d.noShows) / Number(d.total)) * 100) : 0,
        })),
        byService: serviceStats.map((s) => ({
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          total: Number(s.total),
          noShows: Number(s.noShows),
          rate: Number(s.total) > 0 ? Math.round((Number(s.noShows) / Number(s.total)) * 100) : 0,
        })),
        byHour: hourlyStats.map((h) => ({
          hour: Number(h.hour),
          total: Number(h.total),
          noShows: Number(h.noShows),
          rate: Number(h.total) > 0 ? Math.round((Number(h.noShows) / Number(h.total)) * 100) : 0,
        })),
      },
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
