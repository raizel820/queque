import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public endpoint - returns which payment methods are enabled + account details
export async function GET() {
  try {
    let settings = await db.paymentSettings.findFirst();
    if (!settings) {
      return NextResponse.json({
        ccpEnabled: true,
        bankEnabled: true,
        electronicEnabled: true,
        ccpAccount: '0000 0000 0000 0000',
        ccpKey: '00',
        bankAccount: '0000 0000 0000 0000',
        bankRib: '00 000 00000 000 0000 000',
        bankName: 'BNA',
        ewalletNumber: '0XXX XXX XXX',
      });
    }
    return NextResponse.json({
      ccpEnabled: settings.ccpEnabled,
      bankEnabled: settings.bankEnabled,
      electronicEnabled: settings.electronicEnabled,
      ccpAccount: settings.ccpAccount,
      ccpKey: settings.ccpKey,
      bankAccount: settings.bankAccount,
      bankRib: settings.bankRib,
      bankName: settings.bankName,
      ewalletNumber: settings.ewalletNumber,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[payment-settings GET] Error:', message);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
