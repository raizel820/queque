import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'
import { validateBody } from '@/lib/validations'
import { z } from 'zod'

const favoriteBodySchema = z.object({
  agencyId: z.string().min(1, 'Agency ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const validation = validateBody(favoriteBodySchema, body)
    if (validation.error) return validation.error

    const { agencyId } = validation.data

    const userId = user.id

    // Check if already favorited
    const existing = await db.favorite.findUnique({
      where: { userId_agencyId: { userId, agencyId } },
    })

    if (existing) {
      // Remove favorite
      await db.favorite.delete({ where: { id: existing.id } })
      return NextResponse.json({ favorited: false })
    } else {
      // Add favorite
      await db.favorite.create({ data: { userId, agencyId } })
      return NextResponse.json({ favorited: true }, { status: 201 })
    }
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userId = user.id

    const favorites = await db.favorite.findMany({
      where: { userId },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            nameFr: true,
            category: true,
            address: true,
            customCode: true,
            isQueueOpen: true,
            isSponsored: true,
            workingHoursStart: true,
            workingHoursEnd: true,
            services: {
              where: { isActive: true },
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      favorites: favorites.map((f) => ({
        favoriteId: f.id,
        agencyId: f.agencyId,
        favoritedAt: f.createdAt,
        ...f.agency,
      })),
    })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
