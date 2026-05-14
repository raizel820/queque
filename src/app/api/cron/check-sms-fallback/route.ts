import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeDzPhone, getSmsTemplate } from '@/lib/sms-service';
import { sendSms } from '@/lib/sms-service';

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
            averageServiceTime: true,
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

      // Normalize phone number for Algerian format
      const normalizedPhone = normalizeDzPhone(user.phoneNumber!);
      if (!normalizedPhone) {
        // Log failure for invalid phone
        await db.smsLog.create({
          data: {
            userId: user.id,
            phoneNumber: user.phoneNumber!,
            message: 'SMS fallback - invalid phone',
            status: 'FAILED',
            provider: 'system',
            errorMessage: `Invalid phone number format: ${user.phoneNumber}`,
          },
        });
        continue;
      }

      // Build localized SMS message
      const lang = user.language || 'ar';
      const agencyName = lang === 'ar'
        ? reservation.agency.nameAr || reservation.agency.name
        : lang === 'fr'
          ? reservation.agency.nameFr || reservation.agency.name
          : reservation.agency.name;

      // Calculate estimated wait
      const position = reservation.queueNumber; // simplified; in production, query actual position
      const estimatedMinutes = Math.max(1, Math.round(reservation.agency.averageServiceTime || 10));

      const smsMessage = getSmsTemplate('turnApproaching', lang, {
        ticketNumber: reservation.displayNumber,
        agencyName,
        position,
        estimatedMinutes,
      });

      // Attempt to send SMS via configured provider
      const result = await sendSms(normalizedPhone, smsMessage, user.id);

      if (result.success) {
        // Mark SMS reminder as sent on the reservation
        await db.reservation.update({
          where: { id: reservation.id },
          data: {
            smsReminderSent: true,
            smsReminderSentAt: new Date(),
          },
        });
        smsSent++;
      } else {
        console.error(`[cron/check-sms-fallback] Failed to send SMS to ${normalizedPhone}: ${result.error}`);
      }
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
