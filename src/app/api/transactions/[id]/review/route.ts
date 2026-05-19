import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, reviewedBy, rejectionReason } = body

    // Validate status
    const validStatuses = ['APPROVED', 'REJECTED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate reviewedBy is a real user ID if provided
    let validReviewedBy: string | null = null
    if (reviewedBy) {
      const reviewer = await db.user.findUnique({ where: { id: reviewedBy } })
      if (reviewer) {
        validReviewedBy = reviewedBy
      }
    }

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

    // Update transaction
    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: {
        status,
        reviewedBy: validReviewedBy,
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
        userId: validReviewedBy,
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
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
