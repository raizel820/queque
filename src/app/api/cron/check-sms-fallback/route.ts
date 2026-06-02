import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeDzPhone, getSmsTemplate } from '@/lib/sms-service';
import { sendSms } from '@/lib/sms-service';

const SMS_FALLBACK_MINUTES = 10;

export async function GET(request: NextRequest) {
  // CRON_SECRET verification - prevents unauthorized external triggering
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  try {
    const cutoffTime = new Date(Date.now() - SMS_FALLBACK_MINUTES * 60 * 1000);

    // Find reservations where in-app reminder may have been sent but SMS not yet sent
    // Use basic fields in Prisma query, filter advanced fields in code
    const allCandidates = await db.reservation.findMany({
      where: {
        status: { in: ['WAITING', 'CALLED'] },
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

    // Filter in code for fields that may not exist in Prisma Client on Vercel
    const candidates = allCandidates.filter(r => {
      const rAny = r as Record<string, unknown>;
      // Must have reminderSent = true
      if (rAny.reminderSent !== true) return false;
      // Must have reminderSentAt not null and <= cutoff
      const reminderSentAt = rAny.reminderSentAt as Date | null;
      if (!reminderSentAt || reminderSentAt > cutoffTime) return false;
      // Must NOT have smsReminderSent = true
      if (rAny.smsReminderSent === true) return false;
      // Must NOT be skipped for no-show
      if (rAny.skippedForNoShow === true) return false;
      return true;
    });

    let smsSent = 0;
    let noCredit = 0;

    for (const reservation of candidates) {
      const user = reservation.user;

      // Skip if no user account (walk-in)
      if (!user) continue;

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

      const position = reservation.queueNumber;
      const estimatedMinutes = Math.max(1, Math.round(reservation.agency.averageServiceTime || 10));

      const smsMessage = await getSmsTemplate('turnApproaching', lang, {
        customerName: user.fullName,
        ticketNumber: reservation.displayNumber,
        agencyName,
        position,
        estimatedMinutes,
      });

      const result = await sendSms(normalizedPhone, smsMessage, user.id);

      if (result.success) {
        // Mark SMS reminder as sent using raw SQL (field may not exist in Prisma Client)
        try {
          await db.$executeRaw`UPDATE Reservation SET smsReminderSent = 1, smsReminderSentAt = datetime('now') WHERE id = ${reservation.id}`;
        } catch {
          console.warn('[cron/check-sms-fallback] Could not set smsReminderSent, column may not exist');
        }
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
