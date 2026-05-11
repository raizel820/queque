import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (search) {
      const searchLower = search.toLowerCase()
      where.OR = [
        { name: { contains: search } },
        { nameFr: { contains: search } },
        { nameAr: { contains: search } },
        { customCode: { contains: search } },
      ]
    }

    if (category) {
      where.category = category
    }

    const [agencies, total] = await Promise.all([
      db.agency.findMany({
        where,
        include: {
          _count: {
            select: { services: { where: { isActive: true } } },
          },
          queueSettings: {
            select: { isPaused: true },
            take: 1,
            orderBy: { updatedAt: 'desc' },
          },
        },
        orderBy: [
          { isSponsored: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      db.agency.count({ where }),
    ])

    const formattedAgencies = agencies.map((agency) => ({
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
      isSponsored: agency.isSponsored,
      isQueueOpen: agency.isQueueOpen,
      serviceCount: agency._count.services,
      workingHoursStart: agency.workingHoursStart,
      workingHoursEnd: agency.workingHoursEnd,
      isPaused: agency.queueSettings.length > 0 ? agency.queueSettings[0].isPaused : false,
      avgServiceTime: agency.averageServiceTime,
      createdAt: agency.createdAt,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, nameFr, nameAr, customCode, category, address, phone, email, ownerId } = body

    // Validate required fields
    if (!name || !customCode || !category || !ownerId) {
      return NextResponse.json(
        { success: false, error: 'name, customCode, category, and ownerId are required' },
        { status: 400 }
      )
    }

    // Check for duplicate customCode
    const existingCode = await db.agency.findUnique({
      where: { customCode },
    })
    if (existingCode) {
      return NextResponse.json(
        { success: false, error: 'Agency code already taken' },
        { status: 409 }
      )
    }

    // Create agency with queue settings
    const agency = await db.agency.create({
      data: {
        name,
        nameFr,
        nameAr,
        customCode,
        category,
        address,
        phone,
        email,
        ownerId,
        queueSettings: {
          create: {},
        },
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: ownerId,
        action: 'AGENCY_CREATE',
        entityType: 'AGENCY',
        entityId: agency.id,
        details: JSON.stringify({ name, customCode, category }),
      },
    })

    return NextResponse.json({ success: true, agency }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
