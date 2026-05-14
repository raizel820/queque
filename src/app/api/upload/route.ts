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

function getUploadDir(type: string) {
  return path.join(process.cwd(), 'public', 'uploads', type);
}

function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ext;
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
        { error: 'No file provided. Use FormData with a "file" field.' },
        { status: 400 }
      );
    }

    // ── Validate file size ──
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    // ── Validate file type ──
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `Invalid file type ".${ext}". Allowed types: ${[...ALLOWED_EXTENSIONS].join(', ')}.`,
        },
        { status: 400 }
      );
    }

    if (!isValidMimeType(file.type)) {
      return NextResponse.json(
        { error: `Invalid MIME type "${file.type}".` },
        { status: 400 }
      );
    }

    // ── Generate unique filename & save ──
    const uuid = crypto.randomUUID();
    const filename = `${uuid}.${ext}`;
    const uploadDir = getUploadDir(type);

    await ensureDir(uploadDir);

    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${type}/${filename}`;

    return NextResponse.json({
      url: publicUrl,
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
        { error: 'Provide a "url" field in the request body.' },
        { status: 400 }
      );
    }

    // Prevent path traversal — only allow /uploads/... paths
    if (!url.startsWith('/uploads/') || url.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid URL. Only files under /uploads/ can be deleted.' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', url);

    // Verify the resolved path is still under public/uploads
    const resolved = path.resolve(filePath);
    const allowedRoot = path.resolve(path.join(process.cwd(), 'public', 'uploads'));
    if (!resolved.startsWith(allowedRoot)) {
      return NextResponse.json(
        { error: 'Path traversal detected.' },
        { status: 400 }
      );
    }

    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return NextResponse.json({ success: true }); // already gone
    }
    console.error('[UPLOAD DELETE] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
