import { NextRequest, NextResponse } from 'next/server';
import { put, del, head, list } from '@vercel/blob';

// ─── Helpers ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf']);
const VALID_TYPES = new Set(['general', 'receipt', 'logo', 'avatar']);

/**
 * When the Vercel Blob store is configured as private, ALL uploads must use access: 'private'.
 * Files are then served through the /api/upload/proxy endpoint server-side.
 * Set BLOB_STORE_ACCESS=private if your Vercel Blob store is private.
 * Default is 'private' for maximum compatibility (private stores can't use 'public',
 * but public stores CAN use 'private' and serve through proxy).
 */
const BLOB_STORE_ACCESS = process.env.BLOB_STORE_ACCESS || 'private';

function getBlobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function isVercelDeployment(): boolean {
  return !!process.env.VERCEL;
}

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Determine access level based on upload type and store configuration.
 * - If the blob store is private, ALL uploads must use 'private'
 * - If the blob store is public, receipts still use 'private', others use 'public'
 * - Defaulting to 'private' is safest because:
 *   - Private stores REJECT 'public' access (throws error)
 *   - Public stores ACCEPT 'private' access (works fine, served via proxy)
 */
function getAccessForType(type: string): 'public' | 'private' {
  // If the blob store is private, all uploads must be private
  if (BLOB_STORE_ACCESS === 'private') return 'private';
  // If store is public, receipts are still private, others are public
  if (type === 'receipt') return 'private';
  return 'public';
}

// ─── POST: Upload file ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = getBlobToken();

    // Pre-flight check: on Vercel, Blob must be configured
    if (isVercelDeployment() && !token) {
      return NextResponse.json(
        {
          error: 'File upload requires Vercel Blob storage. Please add a Vercel Blob store to your project and set the BLOB_READ_WRITE_TOKEN environment variable. See: https://vercel.com/docs/storage/vercel-blob',
          code: 'BLOB_NOT_CONFIGURED',
        },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const type = VALID_TYPES.has(searchParams.get('type') || '')
      ? searchParams.get('type')!
      : 'general';

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    // Validate file
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Invalid file type .${ext}` },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 },
      );
    }

    // Optional metadata from form data
    const metadata: Record<string, string> = {};
    for (const key of ['userId', 'agencyId', 'description']) {
      const val = formData.get(key);
      if (val && typeof val === 'string') {
        metadata[key] = val;
      }
    }

    // ── Vercel Blob path ──
    if (token) {
      const access = getAccessForType(type);
      const uuid = crypto.randomUUID();
      const pathname = `${type}/${uuid}.${ext}`;

      const blob = await put(pathname, file, {
        access,
        token,
        addRandomSuffix: true,
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      });

      return NextResponse.json({
        url: blob.url,
        filename: blob.pathname.split('/').pop() || pathname,
        provider: 'vercel-blob',
        size: file.size,
        access,
      });
    }

    // ── Local filesystem fallback (non-Vercel only) ──
    const fs = await import('fs/promises');
    const path = await import('path');
    const localUuid = crypto.randomUUID();
    const localFilename = `${localUuid}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);

    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, localFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/uploads/${type}/${localFilename}`,
      filename: localFilename,
      provider: 'local',
      size: file.size,
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

    const token = getBlobToken();

    // Vercel Blob URL
    if (url.includes('.blob.vercel-storage.com') || url.startsWith('https://')) {
      if (!token) {
        return NextResponse.json(
          { error: 'Cannot delete blob URL without BLOB_READ_WRITE_TOKEN' },
          { status: 400 },
        );
      }
      await del(url, { token });
      return NextResponse.json({ success: true, provider: 'vercel-blob' });
    }

    // Local file (non-Vercel only)
    if (isVercelDeployment()) {
      return NextResponse.json(
        { error: 'Local file deletion is not available on Vercel deployment' },
        { status: 400 },
      );
    }

    if (!url.startsWith('/uploads/') || url.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid local URL' },
        { status: 400 },
      );
    }

    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', url);
    const resolved = path.resolve(filePath);
    const allowedRoot = path.resolve(path.join(process.cwd(), 'public', 'uploads'));
    if (!resolved.startsWith(allowedRoot)) {
      return NextResponse.json({ error: 'Path traversal detected' }, { status: 400 });
    }

    try { await fs.unlink(filePath); } catch { /* already deleted */ }

    return NextResponse.json({ success: true, provider: 'local' });
  } catch (error: unknown) {
    console.error('[UPLOAD DELETE] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
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
    const token = getBlobToken();

    // Get metadata for a specific file
    if (url) {
      if (url.includes('.blob.vercel-storage.com') && token) {
        const blob = await head(url, { token });
        if (!blob) {
          return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        return NextResponse.json({
          url: blob.url,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          contentType: blob.contentType,
          provider: 'vercel-blob',
        });
      }
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // List files
    if (token) {
      const result = await list({
        prefix: prefix || undefined,
        limit,
        cursor: cursor || undefined,
        token,
      });
      return NextResponse.json({
        files: result.blobs.map((b) => ({
          url: b.url,
          name: b.pathname,
          size: b.size,
          uploadedAt: b.uploadedAt,
        })),
        hasMore: result.hasMore,
        cursor: result.cursor,
        provider: 'vercel-blob',
      });
    }

    // No Blob configured — return empty list
    return NextResponse.json({
      files: [],
      hasMore: false,
      provider: isVercelDeployment() ? 'vercel-blob' : 'local',
    });
  } catch (error: unknown) {
    console.error('[UPLOAD GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── HEAD: Check storage status ─────────────────────────────────────────────
export async function HEAD() {
  const token = getBlobToken();
  const isVercel = isVercelDeployment();

  return NextResponse.json({
    storage: token ? 'vercel-blob' : !isVercel ? 'local' : 'none',
    configured: !!token,
    isVercel,
    isLocalAvailable: !isVercel,
    canUpload: !!token || !isVercel,
  });
}
