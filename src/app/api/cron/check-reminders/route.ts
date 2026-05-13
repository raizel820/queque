import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find all WAITING reservations that haven't received a reminder yet,
    // reserved for today (or no specific date), and whose user has reminderMinutes set
    const candidates = await db.reservation.findMany({
      where: {
        status: 'WAITING',
        reminderSent: false,
        skippedForNoShow: false,
        OR: [
          { reservedDate: today },
          { reservedDate: null },
        ],
        user: {
          reminderMinutes: { gt: 0 },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            reminderMinutes: true,
            fullName: true,
            language: true,
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
      orderBy: { queueNumber: 'asc' },
    });

    let remindersSent = 0;

    for (const reservation of candidates) {
      // Calculate people ahead: WAITING reservations for same agency joined before this one
      const peopleAhead = await db.reservation.count({
        where: {
          agencyId: reservation.agencyId,
          status: 'WAITING',
          skippedForNoShow: false,
          joinedAt: { lt: reservation.joinedAt },
          id: { not: reservation.id },
        },
      });

      const avgServiceTime = reservation.agency.averageServiceTime || 10;
      const userReminderMinutes = reservation.user.reminderMinutes || 10;

      // If estimated wait time is within user's reminder window, send reminder
      const estimatedMinutesUntilTurn = peopleAhead * avgServiceTime;
      if (estimatedMinutesUntilTurn <= userReminderMinutes) {
        const agencyName =
          reservation.user.language === 'ar'
            ? reservation.agency.nameAr || reservation.agency.name
            : reservation.user.language === 'fr'
              ? reservation.agency.nameFr || reservation.agency.name
              : reservation.agency.name;

        await db.$transaction(async (tx) => {
          // Mark reminder as sent
          await tx.reservation.update({
            where: { id: reservation.id },
            data: {
              reminderSent: true,
              reminderSentAt: new Date(),
            },
          });

          // Create in-app notification
          await tx.notification.create({
            data: {
              userId: reservation.userId,
              type: 'TURN_APPROACHING',
              title: 'Your Turn is Approaching',
              message: `Your ticket ${reservation.displayNumber} at ${agencyName} is coming up soon. ${peopleAhead === 0 ? 'You are next!' : `Approximately ${peopleAhead} ahead of you.}`}`,
            },
          });
        });

        remindersSent++;
      }
    }

    return NextResponse.json({
      checked: candidates.length,
      remindersSent,
    });
  } catch (error) {
    console.error('[cron/check-reminders] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
