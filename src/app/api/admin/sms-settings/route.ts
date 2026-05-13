import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSmsSettings, maskApiKey, getSmsUsageStats, getRecentSmsLogs, sendSms } from '@/lib/sms-service';

// GET - Return SMS settings + usage stats
export async function GET() {
  try {
    const [settings, stats, recentLogs] = await Promise.all([
      getSmsSettings(),
      getSmsUsageStats(),
      getRecentSmsLogs(10),
    ]);

    return NextResponse.json({
      settings: {
        ...settings,
        apiKey: maskApiKey(settings.apiKey),
      },
      stats,
      recentLogs,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update SMS settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider,
      apiUrl,
      apiKey,
      senderName,
      enabled,
      smsPerReminder,
      maxSmsPerDay,
      testPhoneNumber,
    } = body;

    const settings = await getSmsSettings();

    const updateData: Record<string, unknown> = {};
    if (provider !== undefined) updateData.provider = provider;
    if (apiUrl !== undefined) updateData.apiUrl = apiUrl;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (senderName !== undefined) updateData.senderName = senderName;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (smsPerReminder !== undefined) updateData.smsPerReminder = smsPerReminder;
    if (maxSmsPerDay !== undefined) updateData.maxSmsPerDay = maxSmsPerDay;
    if (testPhoneNumber !== undefined) updateData.testPhoneNumber = testPhoneNumber;

    const updated = await db.smsSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    return NextResponse.json({
      settings: {
        ...updated,
        apiKey: maskApiKey(updated.apiKey),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send test SMS
export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || !phoneNumber.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const result = await sendSms(phoneNumber.trim(), '[QueueWise] Test SMS - SMS gateway is working correctly.');

    if (result.success) {
      return NextResponse.json({ success: true, logId: result.logId });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
