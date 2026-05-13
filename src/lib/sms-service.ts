import { db } from '@/lib/db';

export interface SendSmsResult {
  success: boolean;
  error?: string;
  logId?: string;
}

export interface SmsUsageStats {
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  totalSent: number;
  failedToday: number;
}

/**
 * Get current SMS settings (creates default if none exists)
 */
export async function getSmsSettings() {
  let settings = await db.smsSettings.findFirst();
  if (!settings) {
    settings = await db.smsSettings.create({
      data: {
        provider: 'algeria_sms',
        apiUrl: process.env.SMS_API_URL || '',
        apiKey: process.env.SMS_API_KEY || '',
        senderName: 'QueueWise',
        enabled: false,
        smsPerReminder: 1,
        maxSmsPerDay: 5,
      },
    });
  }
  return settings;
}

/**
 * Mask an API key for display (show first 4 and last 4 chars)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) {
    return key ? '••••' : '';
  }
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

/**
 * Check if a user has SMS credits available
 */
export async function checkUserSmsCredit(userId: string): Promise<{ hasCredit: boolean; freeCount: number; purchasedTotal: number; purchasedUsed: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { freeSmsCount: true },
  });

  if (!user) {
    return { hasCredit: false, freeCount: 0, purchasedTotal: 0, purchasedUsed: 0 };
  }

  // If user has free SMS credits, they're good
  if (user.freeSmsCount > 0) {
    return { hasCredit: true, freeCount: user.freeSmsCount, purchasedTotal: 0, purchasedUsed: 0 };
  }

  // Check purchased SMS packages
  const purchasedTotal = await db.smsPurchase.aggregate({
    where: { userId },
    _sum: { quantity: true },
  });

  const totalPurchased = purchasedTotal._sum.quantity ?? 0;

  // Count used SMS (SENT status logs)
  const usedCount = await db.smsLog.count({
    where: { userId, status: 'SENT' },
  });

  const hasPurchasedCredit = (totalPurchased - usedCount) > 0;

  return {
    hasCredit: hasPurchasedCredit,
    freeCount: user.freeSmsCount,
    purchasedTotal: totalPurchased,
    purchasedUsed: usedCount,
  };
}

/**
 * Deduct SMS credit from user after successful send
 */
async function deductSmsCredit(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { freeSmsCount: true },
  });

  if (!user) return;

  if (user.freeSmsCount > 0) {
    await db.user.update({
      where: { id: userId },
      data: { freeSmsCount: { decrement: 1 } },
    });
  }
  // Otherwise, credit is tracked via SmsLog count
}

/**
 * Get SMS usage statistics
 */
export async function getSmsUsageStats(): Promise<SmsUsageStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1)); // Monday
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [sentToday, sentThisWeek, sentThisMonth, totalSent, failedToday] = await Promise.all([
    db.smsLog.count({
      where: {
        status: 'SENT',
        createdAt: { gte: todayStart },
      },
    }),
    db.smsLog.count({
      where: {
        status: 'SENT',
        createdAt: { gte: weekStart },
      },
    }),
    db.smsLog.count({
      where: {
        status: 'SENT',
        createdAt: { gte: monthStart },
      },
    }),
    db.smsLog.count({
      where: { status: 'SENT' },
    }),
    db.smsLog.count({
      where: {
        status: 'FAILED',
        createdAt: { gte: todayStart },
      },
    }),
  ]);

  return {
    sentToday,
    sentThisWeek,
    sentThisMonth,
    totalSent,
    failedToday,
  };
}

/**
 * Get recent SMS logs (last N)
 */
export async function getRecentSmsLogs(limit = 10) {
  return db.smsLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      smsSettings: {
        select: { id: true, provider: true },
      },
    },
  });
}

/**
 * Send SMS via configured provider
 */
export async function sendSms(phoneNumber: string, message: string, userId?: string): Promise<SendSmsResult> {
  const settings = await getSmsSettings();

  // Check if SMS is enabled
  if (!settings.enabled) {
    return { success: false, error: 'SMS_DISABLED' };
  }

  // Check user credit if userId is provided
  if (userId) {
    const credit = await checkUserSmsCredit(userId);
    if (!credit.hasCredit) {
      return { success: false, error: 'NO_CREDIT' };
    }
  }

  const apiUrl = settings.apiUrl || process.env.SMS_API_URL;
  const apiKey = settings.apiKey || process.env.SMS_API_KEY;
  const senderName = settings.senderName || 'QueueWise';

  if (!apiUrl || !apiKey) {
    // Log the failure
    const log = await db.smsLog.create({
      data: {
        userId,
        phoneNumber,
        message,
        status: 'FAILED',
        provider: settings.provider,
        errorMessage: 'API URL or API Key not configured',
        smsSettingsId: settings.id,
      },
    });
    return { success: false, error: 'NOT_CONFIGURED', logId: log.id };
  }

  try {
    let responseOk = false;
    let responseData: string | null = null;

    if (settings.provider === 'algeria_sms') {
      // Algeria SMS provider format
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          sender: senderName,
          recipient: phoneNumber,
          message,
        }),
      });
      responseOk = res.ok;
      responseData = await res.text().catch(() => null);
    } else {
      // Generic provider - POST JSON
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          to: phoneNumber,
          from: senderName,
          message,
        }),
      });
      responseOk = res.ok;
      responseData = await res.text().catch(() => null);
    }

    const status = responseOk ? 'SENT' : 'FAILED';
    const errorMessage = responseOk ? null : `Provider returned ${status}: ${responseData?.slice(0, 200) ?? 'unknown error'}`;

    // Create SMS log
    const log = await db.smsLog.create({
      data: {
        userId,
        phoneNumber,
        message,
        status,
        provider: settings.provider,
        errorMessage,
        smsSettingsId: settings.id,
      },
    });

    // Deduct credit on success
    if (responseOk && userId) {
      await deductSmsCredit(userId);
    }

    return {
      success: responseOk,
      error: responseOk ? undefined : 'SEND_FAILED',
      logId: log.id,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    const log = await db.smsLog.create({
      data: {
        userId,
        phoneNumber,
        message,
        status: 'FAILED',
        provider: settings.provider,
        errorMessage,
        smsSettingsId: settings.id,
      },
    });

    return { success: false, error: 'SEND_FAILED', logId: log.id };
  }
}

/**
 * Send a test SMS
 */
export async function testSms(phoneNumber: string): Promise<SendSmsResult> {
  const testMessage = `[QueueWise] ${new Date().toLocaleString()} - Test SMS. If you receive this, the SMS gateway is working correctly.`;
  return sendSms(phoneNumber, testMessage);
}
