import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'
import { updateAgencyProfileSchema, validateBody } from '@/lib/validations'

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
  } catch (_error: unknown) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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

    // SECURITY: Verify the user has access to this agency (owner/staff/admin)
    await requireAgencyAccess(request, id)

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

    // Validate input with Zod (only allow safe fields)
    const validation = validateBody(updateAgencyProfileSchema, body)
    if (validation.error) return validation.error

    // Build update data from validated fields only
    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(validation.data)) {
      if (value !== undefined) {
        updateData[key] = value
      }
    }

    // Never allow updating ownerId, isActive, isSponsored via this route
    // Those are admin-only operations via /api/admin/agencies/[id]

    const agency = await db.agency.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, agency })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
