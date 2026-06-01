import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'

/**
 * GET /api/agency/peak-hours?agencyId=XXX
 * Returns peak-hour analysis and demand patterns for the agency
 */
export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get('agencyId')
    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 })
    }

    await requireAgencyAccess(req, agencyId)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Hourly demand distribution
    const hourlyDemand = await db.$queryRaw<Array<{ hour: number; count: number; avgWait: number }>>`
      SELECT 
        CAST(strftime('%H', joinedAt) AS INTEGER) as hour,
        COUNT(*) as count,
        COALESCE(AVG(estimatedWait), 0) as avgWait
      FROM Reservation
      WHERE agencyId = ${agencyId}
        AND joinedAt >= ${thirtyDaysAgo}
      GROUP BY hour
      ORDER BY hour ASC
    `

    // Day of week demand
    const weekdayDemand = await db.$queryRaw<Array<{ weekday: number; count: number; avgWait: number }>>`
      SELECT 
        CAST(strftime('%w', joinedAt) AS INTEGER) as weekday,
        COUNT(*) as count,
        COALESCE(AVG(estimatedWait), 0) as avgWait
      FROM Reservation
      WHERE agencyId = ${agencyId}
        AND joinedAt >= ${thirtyDaysAgo}
      GROUP BY weekday
      ORDER BY weekday ASC
    `

    // Peak hours by service
    const servicePeakHours = await db.$queryRaw<
      Array<{ serviceId: string; serviceName: string; peakHour: number; count: number }>
    >`
      SELECT 
        r.serviceId,
        s.name as serviceName,
        CAST(strftime('%H', r.joinedAt) AS INTEGER) as peakHour,
        COUNT(*) as count
      FROM Reservation r
      JOIN Service s ON r.serviceId = s.id
      WHERE r.agencyId = ${agencyId}
        AND r.joinedAt >= ${thirtyDaysAgo}
      GROUP BY r.serviceId, s.name, peakHour
      ORDER BY r.serviceId, count DESC
    `

    // Find top 3 peak hours
    const peakHours = hourlyDemand
      .map((h) => ({ hour: Number(h.hour), count: Number(h.count), avgWait: Number(h.avgWait) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // Busiest weekday
    const busiestDay =
      weekdayDemand.length > 0
        ? weekdayDemand
            .map((d) => ({
              weekday: Number(d.weekday),
              count: Number(d.count),
              avgWait: Number(d.avgWait),
            }))
            .sort((a, b) => b.count - a.count)[0]
        : null

    // Daily average wait time trend (past 30 days)
    const dailyWaitTrend = await db.$queryRaw<Array<{ date: string; avgWait: number; count: number }>>`
      SELECT 
        DATE(joinedAt) as date,
        COALESCE(AVG(estimatedWait), 0) as avgWait,
        COUNT(*) as count
      FROM Reservation
      WHERE agencyId = ${agencyId}
        AND joinedAt >= ${thirtyDaysAgo}
      GROUP BY DATE(joinedAt)
      ORDER BY date ASC
    `

    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    return NextResponse.json({
      success: true,
      analytics: {
        peakHours,
        busiestDay: busiestDay
          ? { ...busiestDay, name: weekdayNames[busiestDay.weekday] }
          : null,
        hourlyDemand: hourlyDemand.map((h) => ({
          hour: Number(h.hour),
          count: Number(h.count),
          avgWait: Math.round(Number(h.avgWait)),
        })),
        weekdayDemand: weekdayDemand.map((d) => ({
          weekday: Number(d.weekday),
          name: weekdayNames[Number(d.weekday)],
          count: Number(d.count),
          avgWait: Math.round(Number(d.avgWait)),
        })),
        servicePeakHours: servicePeakHours.map((s) => ({
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          peakHour: Number(s.peakHour),
          count: Number(s.count),
        })),
        dailyWaitTrend: dailyWaitTrend.map((d) => ({
          date: d.date,
          avgWait: Math.round(Number(d.avgWait)),
          count: Number(d.count),
        })),
      },
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
