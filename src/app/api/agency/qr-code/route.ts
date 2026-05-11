import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'code query param is required' },
        { status: 400 }
      );
    }

    const url = `https://queuewise.dz/join/${encodeURIComponent(code)}`;

    const svgString = await QRCode.toString(url, {
      type: 'svg',
      width: 256,
      margin: 2,
      color: {
        dark: '#047857',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    return new Response(svgString, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
