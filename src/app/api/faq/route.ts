import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public endpoint - returns only active FAQs
export async function GET() {
  try {
    const faqs = await db.fAQ.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ faqs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[faq GET] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
