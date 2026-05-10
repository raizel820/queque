import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) {
      where.subscriptionStatus = status
    }

    const [agencies, total] = await Promise.all([
      db.agency.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              username: true,
              email: true,
              phoneNumber: true,
            },
          },
          _count: {
            select: {
              reservations: true,
              services: true,
              transactions: true,
            },
          },
          transactions: {
            where: { status: 'PENDING' },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.agency.count({ where }),
    ])

    const formattedAgencies = agencies.map((agency) => ({
      id: agency.id,
      name: agency.name,
      customCode: agency.customCode,
      category: agency.category,
      city: agency.city,
      phone: agency.phone,
      email: agency.email,
      logoUrl: agency.logoUrl,
      isActive: agency.isActive,
      isQueueOpen: agency.isQueueOpen,
      subscriptionTier: agency.subscriptionTier,
      subscriptionStatus: agency.subscriptionStatus,
      isSponsored: agency.isSponsored,
      createdAt: agency.createdAt,
      owner: agency.owner,
      reservationCount: agency._count.reservations,
      serviceCount: agency._count.services,
      transactionCount: agency._count.transactions,
      hasPendingTransaction: agency.transactions.length > 0,
      pendingTransaction: agency.transactions[0] || null,
    }))

    return NextResponse.json({
      success: true,
      agencies: formattedAgencies,
      total,
      limit,
      offset,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
