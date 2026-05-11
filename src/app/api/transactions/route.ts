import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agencyId, amount, plan, paymentMethod, receiptUrl } = body

    // Validate required fields
    if (!agencyId || !amount || !plan || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'agencyId, amount, plan, and paymentMethod are required' },
        { status: 400 }
      )
    }

    const validPlans = ['BASIC', 'PREMIUM']
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { success: false, error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
        { status: 400 }
      )
    }

    const validMethods = ['CCP', 'BANK_TRANSFER', 'ELECTRONIC']
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      )
    }

    // Check agency exists
    const agency = await db.agency.findUnique({ where: { id: agencyId } })
    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        agencyId,
        amount,
        plan,
        paymentMethod,
        receiptUrl,
        status: 'PENDING',
      },
    })

    // Update agency subscription status to PENDING
    await db.agency.update({
      where: { id: agencyId },
      data: { subscriptionStatus: 'PENDING' },
    })

    return NextResponse.json({ success: true, transaction }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              customCode: true,
              category: true,
              subscriptionTier: true,
              subscriptionStatus: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.transaction.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      transactions,
      total,
      limit,
      offset,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
