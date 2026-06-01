import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';
import { validateBody, paymentSettingsSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    let settings = await db.paymentSettings.findFirst();
    if (!settings) {
      // Create default settings if none exist
      settings = await db.paymentSettings.create({ data: {} });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);

    let settings = await db.paymentSettings.findFirst();
    if (!settings) {
      settings = await db.paymentSettings.create({ data: {} });
    }

    const body = await req.json();
    const validation = validateBody(paymentSettingsSchema, body);
    if (validation.error) return validation.error;

    const validatedData = validation.data;

    const updated = await db.paymentSettings.update({
      where: { id: settings.id },
      data: {
        ...(validatedData.ccpEnabled !== undefined && { ccpEnabled: validatedData.ccpEnabled }),
        ...(validatedData.bankEnabled !== undefined && { bankEnabled: validatedData.bankEnabled }),
        ...(validatedData.electronicEnabled !== undefined && { electronicEnabled: validatedData.electronicEnabled }),
        ...(validatedData.ccpAccount !== undefined && { ccpAccount: validatedData.ccpAccount }),
        ...(validatedData.ccpKey !== undefined && { ccpKey: validatedData.ccpKey }),
        ...(validatedData.bankAccount !== undefined && { bankAccount: validatedData.bankAccount }),
        ...(validatedData.bankRib !== undefined && { bankRib: validatedData.bankRib }),
        ...(validatedData.bankName !== undefined && { bankName: validatedData.bankName }),
        ...(validatedData.ewalletNumber !== undefined && { ewalletNumber: validatedData.ewalletNumber }),
      },
    });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}
