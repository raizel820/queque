import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SMS_FALLBACK_MINUTES = 10;

export async function GET() {
  try {
    const cutoffTime = new Date(Date.now() - SMS_FALLBACK_MINUTES * 60 * 1000);

    // Find reservations where in-app reminder was sent 10+ minutes ago but SMS not yet sent
    const candidates = await db.reservation.findMany({
      where: {
        status: { in: ['WAITING', 'CALLED'] },
        reminderSent: true,
        reminderSentAt: { not: null, lte: cutoffTime },
        smsReminderSent: false,
        skippedForNoShow: false,
        user: {
          smsNotificationsEnabled: true,
          phoneNumber: { not: null },
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            freeSmsCount: true,
            language: true,
            smsPurchases: {
              select: { id: true, quantity: true, price: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        agency: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            nameFr: true,
          },
        },
      },
    });

    let smsSent = 0;
    let noCredit = 0;

    for (const reservation of candidates) {
      const user = reservation.user;

      // Check SMS credits: free credits + purchased credits
      const totalFreeCredits = user.freeSmsCount || 0;
      const totalPurchasedCredits = user.smsPurchases.reduce((sum, p) => sum + p.quantity, 0);

      if (totalFreeCredits + totalPurchasedCredits <= 0) {
        noCredit++;
        continue;
      }

      const agencyName =
        user.language === 'ar'
          ? reservation.agency.nameAr || reservation.agency.name
          : user.language === 'fr'
            ? reservation.agency.nameFr || reservation.agency.name
            : reservation.agency.name;

      const smsMessage = `QueueWise Alert: Your ticket ${reservation.displayNumber} at ${agencyName} is ready. Please head to the service counter now!`;

      // Attempt to send SMS (currently logged, actual SMS integration would go here)
      await db.$transaction(async (tx) => {
        // Deduct from free SMS count first
        await tx.user.update({
          where: { id: user.id },
          data: {
            freeSmsCount: Math.max(0, totalFreeCredits - 1),
          },
        });

        // Mark SMS reminder as sent on the reservation
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            smsReminderSent: true,
            smsReminderSentAt: new Date(),
          },
        });

        // Create SMS log entry
        await tx.smsLog.create({
          data: {
            userId: user.id,
            phoneNumber: user.phoneNumber!,
            message: smsMessage,
            status: 'SENT',
            provider: 'algeria_sms',
          },
        });
      });

      smsSent++;
    }

    return NextResponse.json({
      checked: candidates.length,
      smsSent,
      noCredit,
    });
  } catch (error) {
    console.error('[cron/check-sms-fallback] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
