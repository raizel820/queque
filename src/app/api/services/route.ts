import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'
import { createServiceSchema, validateBody } from '@/lib/validations'

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

    const services = await db.service.findMany({
      where: {
        agencyId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, services })
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
    const { agencyId, name, nameFr, nameAr, prefix } = body

    // SECURITY: Verify the user has access to the specified agency
    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'agencyId is required' },
        { status: 400 }
      )
    }

    await requireAgencyAccess(request, agencyId)

    // Validate input with Zod
    const validation = validateBody(createServiceSchema, { name, nameFr, nameAr, prefix })
    if (validation.error) return validation.error

    // Check agency exists
    const agency = await db.agency.findUnique({ where: { id: agencyId } })
    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }

    // Create service
    const service = await db.service.create({
      data: {
        agencyId,
        name: validation.data.name,
        nameFr: validation.data.nameFr || null,
        nameAr: validation.data.nameAr || null,
        prefix: prefix || validation.data.name.charAt(0).toUpperCase(),
      },
    })

    return NextResponse.json({ success: true, service }, { status: 201 })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
