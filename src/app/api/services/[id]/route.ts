import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check service exists
    const service = await db.service.findUnique({ where: { id } })
    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    // SECURITY: Verify the user has access to the agency that owns this service
    await requireAgencyAccess(request, service.agencyId)

    // Soft delete
    const updatedService = await db.service.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, service: updatedService })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
