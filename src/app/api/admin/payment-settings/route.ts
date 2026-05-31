import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';

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
    const updated = await db.paymentSettings.update({
      where: { id: settings.id },
      data: {
        ...(body.ccpEnabled !== undefined && { ccpEnabled: body.ccpEnabled }),
        ...(body.bankEnabled !== undefined && { bankEnabled: body.bankEnabled }),
        ...(body.electronicEnabled !== undefined && { electronicEnabled: body.electronicEnabled }),
        ...(body.ccpAccount !== undefined && { ccpAccount: body.ccpAccount }),
        ...(body.ccpKey !== undefined && { ccpKey: body.ccpKey }),
        ...(body.bankAccount !== undefined && { bankAccount: body.bankAccount }),
        ...(body.bankRib !== undefined && { bankRib: body.bankRib }),
        ...(body.bankName !== undefined && { bankName: body.bankName }),
        ...(body.ewalletNumber !== undefined && { ewalletNumber: body.ewalletNumber }),
      },
    });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}
