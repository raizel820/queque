import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'
import { validateBody, updateCounterSchema } from '@/lib/validations'

// PATCH /api/agency/branches/[id]/counters/[counterId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; counterId: string }> }
) {
  try {
    const { id: branchId, counterId } = await params
    const counter = await db.counter.findUnique({ where: { id: counterId }, include: { branch: true } })
    if (!counter || counter.branchId !== branchId) {
      return NextResponse.json({ success: false, error: 'Counter not found' }, { status: 404 })
    }

    await requireAgencyAccess(request, counter.branch.agencyId)

    const body = await request.json()
    const { data, error } = validateBody(updateCounterSchema, body)
    if (error) return error

    // If staffId is provided, verify the staff belongs to the same agency
    if (data.staffId) {
      const staff = await db.agencyStaff.findUnique({ where: { id: data.staffId } })
      if (!staff || staff.agencyId !== counter.branch.agencyId) {
        return NextResponse.json(
          { success: false, error: 'Staff member not found in this agency' },
          { status: 400 }
        )
      }
    }

    const updated = await db.counter.update({
      where: { id: counterId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr || null }),
        ...(data.nameFr !== undefined && { nameFr: data.nameFr || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.staffId !== undefined && { staffId: data.staffId }),
      },
    })

    return NextResponse.json({ success: true, counter: updated })
  } catch (error) {
    return authErrorResponse(error)
  }
}

// DELETE /api/agency/branches/[id]/counters/[counterId] (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; counterId: string }> }
) {
  try {
    const { id: branchId, counterId } = await params
    const counter = await db.counter.findUnique({ where: { id: counterId }, include: { branch: true } })
    if (!counter || counter.branchId !== branchId) {
      return NextResponse.json({ success: false, error: 'Counter not found' }, { status: 404 })
    }

    await requireAgencyAccess(request, counter.branch.agencyId)

    const updated = await db.counter.update({
      where: { id: counterId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, counter: updated })
  } catch (error) {
    return authErrorResponse(error)
  }
}
