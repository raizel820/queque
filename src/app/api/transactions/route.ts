import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'
import { validateBody } from '@/lib/validations'
import { z } from 'zod'

const createTransactionSchema = z.object({
  agencyId: z.string().min(1, 'Agency ID is required'),
  amount: z.number().int().positive('Amount must be a positive number'),
  plan: z.enum(['BASIC', 'PREMIUM'], { errorMap: () => ({ message: 'Invalid plan. Must be BASIC or PREMIUM' }) }),
  paymentMethod: z.enum(['CCP', 'BANK_TRANSFER', 'E_WALLET', 'CASH'], { errorMap: () => ({ message: 'Invalid payment method' }) }),
  receiptUrl: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateBody(createTransactionSchema, body)
    if (validation.error) return validation.error

    const { agencyId, amount, plan, paymentMethod, receiptUrl } = validation.data

    // Verify agency access
    await requireAgencyAccess(request, agencyId)

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
    return authErrorResponse(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    // SUPER_ADMIN can see all transactions; agency users see only their agency's
    if (user.role !== 'SUPER_ADMIN') {
      // For agency owners/staff, filter to their agency's transactions
      const ownedAgency = await db.agency.findFirst({
        where: { ownerId: user.id },
        select: { id: true },
      })
      if (ownedAgency) {
        where.agencyId = ownedAgency.id
      } else {
        // Staff members
        const staffRecord = await db.agencyStaff.findFirst({
          where: { userId: user.id, isActive: true },
          select: { agencyId: true },
        })
        if (staffRecord) {
          where.agencyId = staffRecord.agencyId
        } else {
          // Customer or user with no agency — return empty
          return NextResponse.json({
            success: true,
            transactions: [],
            total: 0,
            limit,
            offset,
          })
        }
      }
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
    return authErrorResponse(error)
  }
}
