import { NextRequest, NextResponse } from 'next/server';
import {
  uploadFile,
  deleteFile,
  getFileMetadata,
  listFiles,
  isValidType,
  DEFAULT_TYPE,
  isVercelBlobConfigured,
  isVercelDeployment,
  isLocalStorageAvailable,
} from '@/lib/upload';

// ─── POST: Upload file ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Pre-flight check: ensure upload is possible in this environment
    if (isVercelDeployment() && !isVercelBlobConfigured()) {
      return NextResponse.json(
        {
          error: 'File upload requires Vercel Blob storage. Please add a Vercel Blob store to your project and set the BLOB_READ_WRITE_TOKEN environment variable. See: https://vercel.com/docs/storage/vercel-blob',
          code: 'BLOB_NOT_CONFIGURED',
        },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const type = isValidType(searchParams.get('type') || '')
      ? searchParams.get('type')!
      : DEFAULT_TYPE;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    // Optional metadata from form data
    const metadata: Record<string, string> = {};
    const metaKeys = ['userId', 'agencyId', 'description'];
    for (const key of metaKeys) {
      const val = formData.get(key);
      if (val && typeof val === 'string') {
        metadata[key] = val;
      }
    }

    const result = await uploadFile(file, type, {
      addRandomSuffix: false,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });

    return NextResponse.json({
      url: result.url,
      filename: result.filename,
      provider: result.provider,
      size: result.size,
    });
  } catch (error: unknown) {
    console.error('[UPLOAD] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('too large') ? 413
      : message.includes('Invalid') ? 400
      : message.includes('BLOB_READ_WRITE_TOKEN') || message.includes('Vercel Blob') ? 503
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// ─── DELETE: Remove uploaded file ───────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Provide a "url" field' },
        { status: 400 },
      );
    }

    const result = await deleteFile(url);
    return NextResponse.json({ success: result.success, provider: result.provider });
  } catch (error: unknown) {
    console.error('[UPLOAD DELETE] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('Invalid') || message.includes('Cannot') || message.includes('not available') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// ─── GET: List or get file metadata ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const prefix = searchParams.get('prefix') || '';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const cursor = searchParams.get('cursor') || undefined;

    // If a specific URL is provided, return its metadata
    if (url) {
      const metadata = await getFileMetadata(url);
      if (!metadata) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 },
        );
      }
      return NextResponse.json(metadata);
    }

    // Otherwise, list files
    const result = await listFiles({ prefix, limit, cursor });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[UPLOAD GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── HEAD: Check storage status ─────────────────────────────────────────────
export async function HEAD() {
  const isVercel = isVercelDeployment();
  const isBlobConfigured = isVercelBlobConfigured();
  const isLocal = isLocalStorageAvailable();

  return NextResponse.json({
    storage: isBlobConfigured ? 'vercel-blob' : isLocal ? 'local' : 'none',
    configured: isBlobConfigured,
    isVercel,
    isLocalAvailable: isLocal,
    canUpload: isBlobConfigured || isLocal,
  });
}
