import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard'
import { validateBody, adminCreateAgencySchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    const body = await request.json()
    const validation = validateBody(adminCreateAgencySchema, body)
    if (validation.error) return validation.error

    const { name, nameAr, nameFr, description, address, phone, category, ownerId, customCode } = validation.data

    // SECURITY: ownerId must always be provided — derive from admin session if missing
    const resolvedOwnerId = ownerId || admin.id

    const agency = await db.agency.create({
      data: {
        name,
        nameAr: nameAr || name,
        nameFr: nameFr || name,
        description,
        address,
        phone,
        category,
        ownerId: resolvedOwnerId,
        customCode: customCode || `AG${Date.now().toString(36).toUpperCase()}`,
      },
    })

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'AGENCY_CREATE',
        entityType: 'AGENCY',
        entityId: agency.id,
        details: JSON.stringify({ agencyName: name, category }),
      },
    })

    return NextResponse.json({ success: true, agency }, { status: 201 })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

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
  } catch (error) {
    return authErrorResponse(error)
  }
}
