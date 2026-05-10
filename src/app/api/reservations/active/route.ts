import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const reservations = await db.reservation.findMany({
      where: {
        userId,
        status: { in: ['WAITING', 'CALLED'] },
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            nameAr: true,
            customCode: true,
            category: true,
            address: true,
            logoUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            nameAr: true,
            prefix: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    return NextResponse.json({ success: true, reservations })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
