import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';

// GET all FAQs (including inactive)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const faqs = await db.fAQ.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ faqs });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// POST create new FAQ
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { question, questionFr, questionAr, answer, answerFr, answerAr, category, order, isActive } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const faq = await db.fAQ.create({
      data: {
        question,
        questionFr: questionFr || null,
        questionAr: questionAr || null,
        answer,
        answerFr: answerFr || null,
        answerAr: answerAr || null,
        category: category || 'SUBSCRIPTION',
        order: order ?? 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ faq }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// PUT update FAQ
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { id, question, questionFr, questionAr, answer, answerFr, answerAr, category, order, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }

    const existing = await db.fAQ.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    const faq = await db.fAQ.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(questionFr !== undefined && { questionFr: questionFr || null }),
        ...(questionAr !== undefined && { questionAr: questionAr || null }),
        ...(answer !== undefined && { answer }),
        ...(answerFr !== undefined && { answerFr: answerFr || null }),
        ...(answerAr !== undefined && { answerAr: answerAr || null }),
        ...(category !== undefined && { category }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ faq });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// DELETE FAQ
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }

    const existing = await db.fAQ.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    await db.fAQ.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
