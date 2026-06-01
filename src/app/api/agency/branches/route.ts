import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'
import { validateBody, createBranchSchema } from '@/lib/validations'

// GET /api/agency/branches?agencyId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')
    if (!agencyId) {
      return NextResponse.json({ success: false, error: 'agencyId is required' }, { status: 400 })
    }

    await requireAgencyAccess(request, agencyId)

    const branches = await db.branch.findMany({
      where: { agencyId },
      include: {
        _count: { select: { counters: true, staff: true } },
      },
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({ success: true, branches })
  } catch (error) {
    return authErrorResponse(error)
  }
}

// POST /api/agency/branches
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const agencyId = body.agencyId as string | undefined
    if (!agencyId) {
      return NextResponse.json({ success: false, error: 'agencyId is required' }, { status: 400 })
    }

    await requireAgencyAccess(request, agencyId)

    const { data, error } = validateBody(createBranchSchema, body)
    if (error) return error

    // If this branch is set as main, unset other main branches
    if (data.isMain) {
      await db.branch.updateMany({
        where: { agencyId, isMain: true },
        data: { isMain: false },
      })
    }

    const branch = await db.branch.create({
      data: {
        name: data.name,
        nameAr: data.nameAr || null,
        nameFr: data.nameFr || null,
        address: data.address || null,
        phone: data.phone || null,
        isMain: data.isMain,
        agencyId,
      },
    })

    return NextResponse.json({ success: true, branch }, { status: 201 })
  } catch (error) {
    return authErrorResponse(error)
  }
}
