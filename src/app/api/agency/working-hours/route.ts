import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'

export async function PATCH(request: NextRequest) {
  try {
    const { agencyId, workingHoursStart, workingHoursEnd } = await request.json()

    if (!agencyId) {
      return NextResponse.json(
        { error: 'agencyId is required' },
        { status: 400 }
      )
    }

    await requireAgencyAccess(request, agencyId)

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (workingHoursStart && !timeRegex.test(workingHoursStart)) {
      return NextResponse.json(
        { error: 'Invalid workingHoursStart format. Use HH:MM' },
        { status: 400 }
      )
    }
    if (workingHoursEnd && !timeRegex.test(workingHoursEnd)) {
      return NextResponse.json(
        { error: 'Invalid workingHoursEnd format. Use HH:MM' },
        { status: 400 }
      )
    }

    const agency = await db.agency.update({
      where: { id: agencyId },
      data: {
        ...(workingHoursStart !== undefined && { workingHoursStart }),
        ...(workingHoursEnd !== undefined && { workingHoursEnd }),
      },
      select: {
        id: true,
        workingHoursStart: true,
        workingHoursEnd: true,
      },
    })

    return NextResponse.json(agency)
  } catch (error: unknown) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
