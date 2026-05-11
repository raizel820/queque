import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const agency = await db.agency.findUnique({
      where: { id },
      include: {
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            nameFr: true,
            nameAr: true,
            prefix: true,
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
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        _count: {
          select: {
            reservations: {
              where: { status: { in: ['WAITING', 'CALLED'] } },
            },
          },
        },
      },
    })

    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      agency: {
        ...agency,
        activeQueueCount: agency._count.reservations,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check agency exists
    const existingAgency = await db.agency.findUnique({ where: { id } })
    if (!existingAgency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }

    // If updating customCode, check uniqueness
    if (body.customCode && body.customCode !== existingAgency.customCode) {
      const duplicateCode = await db.agency.findUnique({
        where: { customCode: body.customCode },
      })
      if (duplicateCode) {
        return NextResponse.json(
          { success: false, error: 'Agency code already taken' },
          { status: 409 }
        )
      }
    }

    // Build update data - only allow certain fields
    const allowedFields = [
      'name', 'nameFr', 'nameAr', 'customCode', 'category',
      'address', 'phone', 'email', 'website', 'logoUrl',
      'coverUrl', 'description', 'descriptionFr', 'descriptionAr',
      'isSponsored',
    ] as const

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const agency = await db.agency.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, agency })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
