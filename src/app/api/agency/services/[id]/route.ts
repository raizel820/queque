import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, nameAr, nameFr, prefix } = await req.json();

    const service = await db.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(nameFr !== undefined && { nameFr }),
        ...(prefix && { prefix: prefix.toUpperCase() }),
      },
    });

    return NextResponse.json({ service, success: true });
  } catch (error) {
    console.error('Service PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Service DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
