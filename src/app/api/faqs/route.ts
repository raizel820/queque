import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category');
    const lang = req.nextUrl.searchParams.get('lang') || 'en';

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;

    const faqs = await db.fAQ.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    const localized = faqs.map((faq) => ({
      id: faq.id,
      question:
        lang === 'ar' && faq.questionAr
          ? faq.questionAr
          : lang === 'fr' && faq.questionFr
          ? faq.questionFr
          : faq.question,
      answer:
        lang === 'ar' && faq.answerAr
          ? faq.answerAr
          : lang === 'fr' && faq.answerFr
          ? faq.answerFr
          : faq.answer,
      category: faq.category,
      order: faq.order,
    }));

    return NextResponse.json({ faqs: localized });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[faqs GET] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
