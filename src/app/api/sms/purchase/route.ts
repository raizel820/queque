import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

const ALLOWED_PACKS: Record<string, { quantity: number; price: number }> = {
  '20': { quantity: 20, price: 200 },
  '50': { quantity: 50, price: 400 },
  '100': { quantity: 100, price: 700 },
};

// POST /api/sms/purchase — Purchase an SMS pack
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packId, userId } = body as { packId: string; userId: string };

    if (!packId || !userId) {
      return NextResponse.json(
        { error: 'packId and userId are required' },
        { status: 400 }
      );
    }

    // Validate packId
    const pack = ALLOWED_PACKS[packId];
    if (!pack) {
      return NextResponse.json(
        { error: 'Invalid pack ID. Allowed: 20, 50, 100' },
        { status: 400 }
      );
    }

    // Validate user exists and is active
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 403 }
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/sms/purchase — Get user's SMS purchase history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const purchases = await db.smsPurchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
