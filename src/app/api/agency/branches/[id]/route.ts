import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'
import { validateBody, updateBranchSchema } from '@/lib/validations'

// GET /api/agency/branches/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const branch = await db.branch.findUnique({
      where: { id },
      include: {
        counters: {
          include: {
            staff: { include: { user: { select: { fullName: true, username: true } } } },
            currentReservation: { select: { id: true, displayNumber: true, status: true } },
          },
          orderBy: { number: 'asc' },
        },
        _count: { select: { staff: true } },
      },
    })

    if (!branch) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 })
    }

    await requireAgencyAccess(_request, branch.agencyId)

    return NextResponse.json({ success: true, branch })
  } catch (error) {
    return authErrorResponse(error)
  }
}

// PATCH /api/agency/branches/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const branch = await db.branch.findUnique({ where: { id } })
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 })
    }

    await requireAgencyAccess(request, branch.agencyId)

    const body = await request.json()
    const { data, error } = validateBody(updateBranchSchema, body)
    if (error) return error

    // If setting as main, unset other main branches
    if (data.isMain) {
      await db.branch.updateMany({
        where: { agencyId: branch.agencyId, isMain: true },
        data: { isMain: false },
      })
    }

    const updated = await db.branch.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, branch: updated })
  } catch (error) {
    return authErrorResponse(error)
  }
}

// DELETE /api/agency/branches/[id] (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const branch = await db.branch.findUnique({ where: { id } })
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 })
    }

    await requireAgencyAccess(request, branch.agencyId)

    const updated = await db.branch.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, branch: updated })
  } catch (error) {
    return authErrorResponse(error)
  }
}
