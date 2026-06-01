import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'
import { validateBody, createCounterSchema } from '@/lib/validations'

// GET /api/agency/branches/[id]/counters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: branchId } = await params
    const branch = await db.branch.findUnique({ where: { id: branchId } })
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 })
    }

    await requireAgencyAccess(request, branch.agencyId)

    const counters = await db.counter.findMany({
      where: { branchId },
      include: {
        staff: { include: { user: { select: { fullName: true, username: true } } } },
        currentReservation: { select: { id: true, displayNumber: true, status: true } },
      },
      orderBy: { number: 'asc' },
    })

    return NextResponse.json({ success: true, counters })
  } catch (error) {
    return authErrorResponse(error)
  }
}

// POST /api/agency/branches/[id]/counters
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: branchId } = await params
    const branch = await db.branch.findUnique({ where: { id: branchId } })
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 })
    }

    await requireAgencyAccess(request, branch.agencyId)

    const body = await request.json()
    const { data, error } = validateBody(createCounterSchema, body)
    if (error) return error

    // Check if counter number already exists in this branch
    const existing = await db.counter.findUnique({
      where: { branchId_number: { branchId, number: data.number } },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Counter number already exists in this branch' },
        { status: 409 }
      )
    }

    const counter = await db.counter.create({
      data: {
        number: data.number,
        name: data.name,
        nameAr: data.nameAr || null,
        nameFr: data.nameFr || null,
        branchId,
      },
    })

    return NextResponse.json({ success: true, counter }, { status: 201 })
  } catch (error) {
    return authErrorResponse(error)
  }
}
