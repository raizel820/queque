import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache, CACHE_TTL } from '@/lib/cache'

export async function GET() {
  try {
    // Cache analytics for 60 seconds - this is expensive and data is historical
    const result = await cache.getOrSet(
      'admin:analytics',
      async () => {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

        // Total reservations
        const totalReservations = await db.reservation.count()

        // Registration trend - use raw SQL for efficiency
        const regTrend = await db.$queryRaw<Array<{ date: string; count: bigint }>>`
          SELECT DATE(createdAt) as date, COUNT(*) as count
          FROM User
          WHERE createdAt >= ${thirtyDaysAgoStr}
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `

        // Fill in missing days
        const dailyRegistrations: Record<string, number> = {}
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const key = d.toISOString().split('T')[0]
          dailyRegistrations[key] = 0
        }
        for (const r of regTrend) {
          if (r.date in dailyRegistrations) {
            dailyRegistrations[r.date] = Number(r.count)
          }
        }

        // Top agencies - use raw SQL for efficiency
        const topAgenciesRaw = await db.$queryRaw<Array<{ agencyId: string; cnt: bigint }>>`
          SELECT agencyId, COUNT(*) as cnt
          FROM Reservation
          WHERE joinedAt >= ${thirtyDaysAgoStr}
          GROUP BY agencyId
          ORDER BY cnt DESC
          LIMIT 5
        `

        const agencyIds = topAgenciesRaw.map(a => a.agencyId)
        const agencyLookup = agencyIds.length > 0
          ? new Map(
              (await db.agency.findMany({
                where: { id: { in: agencyIds } },
                select: { id: true, name: true, nameAr: true, nameFr: true, category: true },
              })).map(a => [a.id, a])
            )
          : new Map()

        const agencyDetails = topAgenciesRaw.map(a => {
          const agency = agencyLookup.get(a.agencyId)
          return {
            agencyId: a.agencyId,
            name: agency?.name || 'Unknown',
            nameAr: agency?.nameAr,
            nameFr: agency?.nameFr,
            category: agency?.category,
            reservationCount: Number(a.cnt),
          }
        })

        // Average wait times - use raw SQL instead of fetching all records
        const avgWaitRaw = await db.$queryRaw<Array<{ agencyId: string; avgWait: number | null }>>`
          SELECT agencyId,
                 ROUND(AVG((julianday(calledAt) - julianday(joinedAt)) * 1440)) as avgWait
          FROM Reservation
          WHERE calledAt IS NOT NULL
          AND joinedAt >= ${thirtyDaysAgoStr}
          GROUP BY agencyId
        `

        const avgWaitAgencyIds = avgWaitRaw.map(a => a.agencyId)
        const avgWaitLookup = avgWaitAgencyIds.length > 0
          ? new Map(
              (await db.agency.findMany({
                where: { id: { in: avgWaitAgencyIds } },
                select: { id: true, name: true },
              })).map(a => [a.id, a.name])
            )
          : new Map()

        const avgWaitPerAgency = avgWaitRaw.map(a => ({
          agencyId: a.agencyId,
          name: avgWaitLookup.get(a.agencyId) || 'Unknown',
          avgWaitTime: Number(a.avgWait || 0),
        }))

        // Peak hours - use raw SQL
        const peakHoursRaw = await db.$queryRaw<Array<{ hour: bigint; count: bigint }>>`
          SELECT CAST(strftime('%H', joinedAt) AS INTEGER) as hour, COUNT(*) as count
          FROM Reservation
          WHERE joinedAt >= ${thirtyDaysAgoStr}
          GROUP BY hour
          ORDER BY hour
        `

        const hourlyDistribution = new Array(24).fill(0)
        peakHoursRaw.forEach(r => {
          const h = Number(r.hour)
          if (h >= 0 && h < 24) hourlyDistribution[h] = Number(r.count)
        })

        // Customer growth - use raw SQL with cumulative sum
        const customerGrowthRaw = await db.$queryRaw<Array<{ date: string; daily: bigint }>>`
          SELECT DATE(createdAt) as date, COUNT(*) as daily
          FROM User
          WHERE role = 'CUSTOMER'
          AND createdAt >= ${thirtyDaysAgoStr}
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `

        const customersBefore = await db.user.count({
          where: {
            role: 'CUSTOMER',
            createdAt: { lt: thirtyDaysAgo },
          },
        })

        const dailyCustomerGrowth: Record<string, number> = {}
        let cumulative = customersBefore
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const key = d.toISOString().split('T')[0]
          const dayCount = Number(customerGrowthRaw.find(c => c.date === key)?.daily || 0)
          cumulative += dayCount
          dailyCustomerGrowth[key] = cumulative
        }

        // Busiest day of week
        const dayOfWeekRaw = await db.$queryRaw<Array<{ dow: bigint; count: bigint }>>`
          SELECT CAST(strftime('%w', joinedAt) AS INTEGER) as dow, COUNT(*) as count
          FROM Reservation
          WHERE joinedAt >= ${thirtyDaysAgoStr}
          GROUP BY dow
        `

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]
        dayOfWeekRaw.forEach(r => {
          const d = Number(r.dow)
          if (d >= 0 && d < 7) dayOfWeekCounts[d] = Number(r.count)
        })
        const busiestDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))
        const peakHourIndex = hourlyDistribution.indexOf(Math.max(...hourlyDistribution))

        const allWaitTimes = avgWaitRaw.map(a => Number(a.avgWait || 0))
        const overallAvgWait = allWaitTimes.length > 0
          ? Math.round(allWaitTimes.reduce((a, b) => a + b, 0) / allWaitTimes.length)
          : 0

        return {
          quickStats: {
            totalReservations,
            avgWaitTime: overallAvgWait,
            busiestDay: dayNames[busiestDayIndex],
            peakHour: `${peakHourIndex}:00`,
          },
          registrationsTrend: Object.entries(dailyRegistrations).map(([date, count]) => ({ date, count })),
          topAgencies: agencyDetails,
          avgWaitPerAgency,
          peakHours: hourlyDistribution.map((count, hour) => ({ hour, count })),
          customerGrowth: Object.entries(dailyCustomerGrowth).map(([date, total]) => ({ date, total })),
        }
      },
      CACHE_TTL.LONG // 60 seconds - analytics data is historical
    )

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[admin/analytics] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
