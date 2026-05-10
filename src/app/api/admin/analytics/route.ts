import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Total reservations (all-time)
    const totalReservations = await db.reservation.count()

    // Registrations trend: daily count for last 30 days
    const registrations = await db.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const dailyRegistrations: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      dailyRegistrations[key] = 0
    }
    for (const r of registrations) {
      const key = r.createdAt.toISOString().split('T')[0]
      if (key in dailyRegistrations) {
        dailyRegistrations[key]++
      }
    }

    // Top performing agencies: most reservations in last 30 days
    const topAgencies = await db.reservation.groupBy({
      by: ['agencyId'],
      where: { joinedAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const agencyDetails = await Promise.all(
      topAgencies.map(async (a) => {
        const agency = await db.agency.findUnique({
          where: { id: a.agencyId },
          select: { id: true, name: true, nameAr: true, nameFr: true, category: true },
        })
        return {
          agencyId: a.agencyId,
          name: agency?.name || 'Unknown',
          nameAr: agency?.nameAr,
          nameFr: agency?.nameFr,
          category: agency?.category,
          reservationCount: a._count.id,
        }
      })
    )

    // Average wait times per agency
    const completedReservations = await db.reservation.findMany({
      where: {
        joinedAt: { gte: thirtyDaysAgo },
        calledAt: { not: null },
      },
      select: {
        agencyId: true,
        joinedAt: true,
        calledAt: true,
      },
    })

    const agencyWaitTimes: Record<string, number[]> = {}
    for (const r of completedReservations) {
      if (r.calledAt) {
        const waitMinutes = (r.calledAt.getTime() - r.joinedAt.getTime()) / (1000 * 60)
        if (!agencyWaitTimes[r.agencyId]) agencyWaitTimes[r.agencyId] = []
        agencyWaitTimes[r.agencyId].push(waitMinutes)
      }
    }

    const avgWaitPerAgency = await Promise.all(
      Object.entries(agencyWaitTimes).map(async ([agencyId, times]) => {
        const agency = await db.agency.findUnique({
          where: { id: agencyId },
          select: { name: true },
        })
        return {
          agencyId,
          name: agency?.name || 'Unknown',
          avgWaitTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
        }
      })
    )

    // Busiest time slots (hour of day distribution)
    const reservationsWithHour = await db.reservation.findMany({
      where: { joinedAt: { gte: thirtyDaysAgo } },
      select: { joinedAt: true },
    })

    const hourlyDistribution: number[] = new Array(24).fill(0)
    for (const r of reservationsWithHour) {
      const hour = r.joinedAt.getHours()
      hourlyDistribution[hour]++
    }

    // Customer growth trend
    const customerGrowth = await db.user.findMany({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const dailyCustomerGrowth: Record<string, number> = {}
    let cumulative = 0
    // Get total customers before 30 days ago for cumulative count
    const customersBefore = await db.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { lt: thirtyDaysAgo },
      },
    })
    cumulative = customersBefore

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      const dayCount = customerGrowth.filter(
        (c) => c.createdAt.toISOString().split('T')[0] === key
      ).length
      cumulative += dayCount
      dailyCustomerGrowth[key] = cumulative
    }

    // Busiest day of week
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    for (const r of reservationsWithHour) {
      dayOfWeekCounts[r.joinedAt.getDay()]++
    }
    const busiestDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))

    // Peak hour
    const peakHourIndex = hourlyDistribution.indexOf(Math.max(...hourlyDistribution))

    // Overall average wait time
    const allWaitTimes = Object.values(agencyWaitTimes).flat()
    const overallAvgWait = allWaitTimes.length > 0
      ? Math.round(allWaitTimes.reduce((a, b) => a + b, 0) / allWaitTimes.length)
      : 0

    return NextResponse.json({
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
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
