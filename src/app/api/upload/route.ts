import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// ─── Configuration ───────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf']);
const ALLOWED_MIME_PREFIXES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
];

const VALID_TYPES = new Set(['general', 'receipt', 'logo', 'avatar']);
const DEFAULT_TYPE = 'general';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// ─── POST: Upload file ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = VALID_TYPES.has(searchParams.get('type') || '')
      ? searchParams.get('type')!
      : DEFAULT_TYPE;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // ── Validate file presence ──
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // ── Validate file size ──
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // ── Validate file type ──
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Invalid file type .${ext}` },
        { status: 400 }
      );
    }

    if (!isValidMimeType(file.type)) {
      return NextResponse.json(
        { error: `Invalid MIME type "${file.type}"` },
        { status: 400 }
      );
    }

    // Try Vercel Blob first
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      try {
        const { put } = await import('@vercel/blob');
        const uuid = crypto.randomUUID();
        const filename = `${type}/${uuid}.${ext}`;
        const blob = await put(filename, file, {
          access: 'public',
          addRandomSuffix: false,
        });
        return NextResponse.json({
          url: blob.url,
          filename: blob.pathname.split('/').pop() || filename,
        });
      } catch (blobError) {
        console.error('[UPLOAD] Blob failed, falling back to local:', blobError);
      }
    }

    // Fallback to local storage
    const uuid = crypto.randomUUID();
    const filename = `${uuid}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);
    await ensureDir(uploadDir);
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    return NextResponse.json({
      url: `/uploads/${type}/${filename}`,
      filename,
    });
  } catch (error: unknown) {
    console.error('[UPLOAD] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
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
        { status: 400 }
      );
    }

    // For Vercel Blob URLs, delete via blob API
    if (url.startsWith('https://')) {
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (blobToken) {
        try {
          const { del } = await import('@vercel/blob');
          await del(url);
          return NextResponse.json({ success: true });
        } catch {
          console.error('[UPLOAD DELETE] Blob delete failed');
        }
      }
    }

    // Local file fallback
    if (!url.startsWith('/uploads/') || url.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', url);
    const resolved = path.resolve(filePath);
    const allowedRoot = path.resolve(path.join(process.cwd(), 'public', 'uploads'));
    if (!resolved.startsWith(allowedRoot)) {
      return NextResponse.json(
        { error: 'Path traversal detected' },
        { status: 400 }
      );
    }

    try {
      await fs.unlink(filePath);
    } catch {
      // Already gone
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[UPLOAD DELETE] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
