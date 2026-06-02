import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';
import { validateBody, faqSchema } from '@/lib/validations';
import { z } from 'zod';

const faqUpdateSchema = faqSchema.extend({
  id: z.string().min(1, 'FAQ ID is required'),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const faqs = await db.faq.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ faqs });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const validation = validateBody(faqSchema, body);
    if (validation.error) return validation.error;

    const { question, answer, questionAr, answerAr, questionFr, answerFr, category, order, isActive } = validation.data;

    const faq = await db.faq.create({
      data: {
        question,
        answer,
        questionAr: questionAr || null,
        answerAr: answerAr || null,
        questionFr: questionFr || null,
        answerFr: answerFr || null,
        category: category || 'GENERAL',
        sortOrder: order ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ faq }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const validation = validateBody(faqUpdateSchema, body);
    if (validation.error) return validation.error;

    const { id, question, answer, questionAr, answerAr, questionFr, answerFr, category, order, isActive } = validation.data;

    const faq = await db.faq.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(questionAr !== undefined && { questionAr }),
        ...(answerAr !== undefined && { answerAr }),
        ...(questionFr !== undefined && { questionFr }),
        ...(answerFr !== undefined && { answerFr }),
        ...(category !== undefined && { category }),
        ...(order !== undefined && { sortOrder: order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ faq });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }

    await db.faq.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
