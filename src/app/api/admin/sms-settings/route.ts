import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSmsSettings,
  maskApiKey,
  getSmsUsageStats,
  getRecentSmsLogs,
  sendSms,
  validateGatewayConnection,
  ALGERIAN_PROVIDERS,
} from '@/lib/sms-service';
import { normalizeDzPhone } from '@/lib/sms-service';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';
import { validateBody, smsSettingsSchema } from '@/lib/validations';
import { z } from 'zod';

const smsTestSchema = z.object({
  action: z.enum(['validate', 'test']).optional(),
  phoneNumber: z.string().optional(),
});

// GET - Return SMS settings + usage stats + providers
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

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
      providers: Object.entries(ALGERIAN_PROVIDERS).map(([id, p]) => ({
        id,
        name: p.name,
        description: p.description,
        defaultApiUrl: p.defaultApiUrl,
        senderIdSupport: p.senderIdSupport,
        docsUrl: p.docsUrl,
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// PUT - Update SMS settings
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const validation = validateBody(smsSettingsSchema, body);
    if (validation.error) return validation.error;

    const {
      provider,
      apiUrl,
      apiKey,
      senderName,
      enabled,
      templateTurnApproaching,
      templateYourTurn,
      templateNoShow,
      templateCustom,
    } = validation.data;
    const { smsPerReminder, maxSmsPerDay, testPhoneNumber } = body;

    // Validate provider
    if (provider && !ALGERIAN_PROVIDERS[provider]) {
      return NextResponse.json(
        { error: `Invalid provider. Supported: ${Object.keys(ALGERIAN_PROVIDERS).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate sender name for providers that require numeric sender
    if (senderName && provider) {
      const providerInfo = ALGERIAN_PROVIDERS[provider as keyof typeof ALGERIAN_PROVIDERS];
      if (providerInfo && !providerInfo.senderIdSupport) {
        if (!senderName.match(/^\+?\d{10,15}$/)) {
          return NextResponse.json(
            { error: `${providerInfo.name} requires a phone number as sender (not alphanumeric).` },
            { status: 400 }
          );
        }
      }
      // Sender name length check (max 11 chars for alphanumeric)
      if (senderName.length > 11) {
        return NextResponse.json(
          { error: 'Sender name must be 11 characters or less' },
          { status: 400 }
        );
      }
    }

    // Validate test phone format
    if (testPhoneNumber) {
      const normalized = normalizeDzPhone(testPhoneNumber);
      if (!normalized && provider !== 'twilio' && provider !== 'vonage') {
        return NextResponse.json(
          { error: 'Invalid Algerian phone number. Expected format: +213XXXXXXXXX or 0XXXXXXXXX (e.g., 0555123456)' },
          { status: 400 }
        );
      }
    }

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
    if (templateTurnApproaching !== undefined) updateData.templateTurnApproaching = templateTurnApproaching;
    if (templateYourTurn !== undefined) updateData.templateYourTurn = templateYourTurn;
    if (templateNoShow !== undefined) updateData.templateNoShow = templateNoShow;
    if (templateCustom !== undefined) updateData.templateCustom = templateCustom;

    const updated = await db.smsSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    // If provider changed, auto-fill the default API URL
    if (provider && !apiUrl && ALGERIAN_PROVIDERS[provider as keyof typeof ALGERIAN_PROVIDERS]) {
      const defaultUrl = ALGERIAN_PROVIDERS[provider as keyof typeof ALGERIAN_PROVIDERS].defaultApiUrl;
      if (defaultUrl && updated.apiUrl !== defaultUrl) {
        await db.smsSettings.update({
          where: { id: settings.id },
          data: { apiUrl: defaultUrl },
        });
        updated.apiUrl = defaultUrl;
      }
    }

    return NextResponse.json({
      settings: {
        ...updated,
        apiKey: maskApiKey(updated.apiKey),
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// POST - Send test SMS
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const validation = validateBody(smsTestSchema, body);
    if (validation.error) return validation.error;

    const { action, phoneNumber } = validation.data;

    // Support both old format (just phoneNumber) and new format (action + phoneNumber)
    if (action === 'validate') {
      // Validate gateway connectivity
      const result = await validateGatewayConnection();
      return NextResponse.json(result);
    }

    const phone = phoneNumber;
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const result = await sendSms(phone.trim(), '[BLASTI] Test SMS - SMS gateway is working correctly.');

    if (result.success) {
      return NextResponse.json({ success: true, logId: result.logId });
    }

    return NextResponse.json(
      { success: false, error: result.error, responseRaw: result.responseRaw },
      { status: 400 }
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}
