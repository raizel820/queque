import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { requireAuth, authErrorResponse } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // Require authentication to generate QR code
    await requireAuth(request);

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
    return authErrorResponse(error)
  }
}
