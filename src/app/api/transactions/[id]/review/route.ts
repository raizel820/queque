import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'
import { validateBody } from '@/lib/validations'
import { z } from 'zod'

const transactionReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const validation = validateBody(transactionReviewSchema, body)
    if (validation.error) return validation.error

    const { status, rejectionReason } = validation.data

    // Find transaction
    const transaction = await db.transaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: `Transaction already ${transaction.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Use session user.id as the reviewer
    const reviewedBy = user.id

    // Update transaction
    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            customCode: true,
            subscriptionTier: true,
            subscriptionStatus: true,
          },
        },
      },
    })

    // If APPROVED, update agency subscription
    if (status === 'APPROVED') {
      await db.agency.update({
        where: { id: transaction.agencyId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionTier: transaction.plan,
        },
      })
    }

    // If REJECTED, reset agency subscription status
    if (status === 'REJECTED') {
      await db.agency.update({
        where: { id: transaction.agencyId },
        data: {
          subscriptionStatus: 'INACTIVE',
        },
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: reviewedBy,
        action: status === 'APPROVED' ? 'PAYMENT_APPROVE' : 'PAYMENT_REJECT',
        entityType: 'TRANSACTION',
        entityId: id,
        details: JSON.stringify({
          transactionId: id,
          agencyId: transaction.agencyId,
          amount: transaction.amount,
          plan: transaction.plan,
          status,
          rejectionReason,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
    })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
