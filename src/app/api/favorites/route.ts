import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, agencyId } = await request.json()

    if (!userId || !agencyId) {
      return NextResponse.json(
        { error: 'userId and agencyId are required' },
        { status: 400 }
      )
    }

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
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

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
        id: f.id,
        agencyId: f.agencyId,
        favoritedAt: f.createdAt,
        ...f.agency,
      })),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
