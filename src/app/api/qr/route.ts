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

    // Encode as a URL so phone scanners can open it as a clickable link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blasti.dz';
    const qrData = `${baseUrl}/?code=${code}`;

    const svgString = await QRCode.toString(qrData, {
      type: 'svg',
      width: 200,
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
