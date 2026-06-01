import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'
import { validateBody, updatePreferencesSchema } from '@/lib/validations'

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { preferences } = body

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'preferences object is required' },
        { status: 400 }
      )
    }

    // Validate the preferences object against the schema
    const validation = validateBody(updatePreferencesSchema, preferences)
    if (validation.error) return validation.error

    const prefsStr = JSON.stringify(preferences)

    const updated = await db.user.update({
      where: { id: user.id },
      data: { notificationPreferences: prefsStr },
      select: {
        id: true,
        notificationPreferences: true,
      },
    })

    return NextResponse.json({
      notificationPreferences: JSON.parse(updated.notificationPreferences),
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
