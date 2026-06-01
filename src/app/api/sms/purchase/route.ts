import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAuth, authErrorResponse, AuthError } from '@/lib/auth-guard';
import { checkRateLimit, RateLimitError, SMS_RATE_LIMIT } from '@/lib/rate-limit';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';

const smsPurchaseSchema = z.object({
  packId: z.enum(['20', '50', '100'], { errorMap: () => ({ message: 'Invalid pack ID. Allowed: 20, 50, 100' }) }),
});

const ALLOWED_PACKS: Record<string, { quantity: number; price: number }> = {
  '20': { quantity: 20, price: 200 },
  '50': { quantity: 50, price: 400 },
  '100': { quantity: 100, price: 700 },
};

// POST /api/sms/purchase — Purchase an SMS pack
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Rate limit by user ID
    checkRateLimit(user.id, SMS_RATE_LIMIT);

    const body = await request.json();
    const validation = validateBody(smsPurchaseSchema, body);
    if (validation.error) return validation.error;

    const { packId } = validation.data;

    // Look up pack details
    const pack = ALLOWED_PACKS[packId];

    // Use session user.id instead of body userId
    const userId = user.id;

    // Validate user is active
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for duplicate purchase (same pack within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentPurchase = await db.smsPurchase.findFirst({
      where: {
        userId,
        quantity: pack.quantity,
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    if (recentPurchase) {
      return NextResponse.json(
        { error: 'You already purchased this pack recently. Please wait a few minutes.' },
        { status: 429 }
      );
    }

    // Create SmsPurchase record and increment user's freeSmsCount in a transaction
    const purchase = await db.$transaction(async (tx) => {
      const newPurchase = await tx.smsPurchase.create({
        data: {
          userId,
          quantity: pack.quantity,
          price: pack.price,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { freeSmsCount: { increment: pack.quantity } },
      });

      await tx.notification.create({
        data: {
          userId,
          type: 'SMS_PURCHASED',
          title: 'SMS Credits Purchased',
          message: `You purchased ${pack.quantity} SMS credits`,
        },
      });

      return newPurchase;
    });

    // Fetch updated user to get new balance
    const updatedUser = await db.user.findUnique({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      newBalance: updatedUser?.freeSmsCount ?? 0,
      purchaseId: purchase.id,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, error: error.message, retryAfter: error.retryAfter },
        { status: 429, headers: { 'Retry-After': String(error.retryAfter) } }
      );
    }
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 }
      );
    }
    return authErrorResponse(error);
  }
}

// GET /api/sms/purchase — Get user's SMS purchase history
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userId = user.id;

    const purchases = await db.smsPurchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    return authErrorResponse(error);
  }
}
