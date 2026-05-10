import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const agency = await db.agency.findUnique({
      where: { customCode: code },
      include: {
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            nameFr: true,
            nameAr: true,
            prefix: true,
            _count: {
              select: {
                reservations: {
                  where: { status: { in: ['WAITING', 'CALLED'] } },
                },
              },
            },
          },
        },
        queueSettings: {
          select: {
            id: true,
            currentServingNumber: true,
            lastIssuedNumber: true,
            isPaused: true,
            openedAt: true,
          },
          take: 1,
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }

    if (!agency.isActive) {
      return NextResponse.json(
        { success: false, error: 'Agency is not active' },
        { status: 404 }
      )
    }

    const servicesWithCount = agency.services.map((service) => ({
      ...service,
      waitingCount: service._count.reservations,
    }))

    return NextResponse.json({
      success: true,
      agency: {
        id: agency.id,
        name: agency.name,
        nameFr: agency.nameFr,
        nameAr: agency.nameAr,
        customCode: agency.customCode,
        category: agency.category,
        address: agency.address,
        city: agency.city,
        phone: agency.phone,
        email: agency.email,
        logoUrl: agency.logoUrl,
        coverUrl: agency.coverUrl,
        description: agency.description,
        isQueueOpen: agency.isQueueOpen,
        isPaused: agency.queueSettings.length > 0 ? agency.queueSettings[0].isPaused : false,
        currentServingNumber: agency.queueSettings.length > 0 ? agency.queueSettings[0].currentServingNumber : 0,
        lastIssuedNumber: agency.queueSettings.length > 0 ? agency.queueSettings[0].lastIssuedNumber : 0,
        services: servicesWithCount,
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
