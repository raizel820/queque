import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')

    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'agencyId is required' },
        { status: 400 }
      )
    }

    // Get agency info
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        name: true,
        isQueueOpen: true,
        averageServiceTime: true,
        maxActiveReservations: true,
      },
    })

    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }

    // Get queue settings
    const queueSettings = await db.queueSettings.findFirst({
      where: { agencyId },
      orderBy: { updatedAt: 'desc' },
    })

    // Get waiting count per service
    const waitingPerService = await db.reservation.groupBy({
      by: ['serviceId'],
      where: {
        agencyId,
        status: 'WAITING',
      },
      _count: {
        id: true,
      },
      orderBy: {
        serviceId: 'asc',
      },
    })

    // Get service details for the counts
    const serviceIds = waitingPerService.map((w) => w.serviceId)
    const services = serviceIds.length > 0
      ? await db.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true, nameFr: true, nameAr: true, prefix: true },
        })
      : []

    const serviceMap = new Map(services.map((s) => [s.id, s]))

    const serviceWaitCounts = waitingPerService.map((w) => ({
      serviceId: w.serviceId,
      serviceName: serviceMap.get(w.serviceId)?.name || 'Unknown',
      servicePrefix: serviceMap.get(w.serviceId)?.prefix || '?',
      waitingCount: w._count.id,
    }))

    // Total waiting count
    const totalWaiting = await db.reservation.count({
      where: { agencyId, status: 'WAITING' },
    })

    const totalActive = await db.reservation.count({
      where: { agencyId, status: { in: ['WAITING', 'CALLED'] } },
    })

    return NextResponse.json({
      success: true,
      status: {
        agencyId: agency.id,
        agencyName: agency.name,
        isQueueOpen: agency.isQueueOpen,
        isPaused: queueSettings?.isPaused || false,
        currentServingNumber: queueSettings?.currentServingNumber || 0,
        lastIssuedNumber: queueSettings?.lastIssuedNumber || 0,
        averageServiceTime: agency.averageServiceTime,
        maxActiveReservations: agency.maxActiveReservations,
        totalWaiting,
        totalActive,
        serviceWaitCounts,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
