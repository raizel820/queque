import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.paymentSettings.findFirst();
    if (!settings) {
      // Create default settings if none exist
      settings = await db.paymentSettings.create({ data: {} });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[admin/payment-settings GET] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
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
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[admin/payment-settings PUT] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
