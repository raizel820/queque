import { NextRequest, NextResponse } from 'next/server';
import { head } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

/**
 * Proxy endpoint for accessing private blob files.
 *
 * Private Vercel Blob files require a BLOB_READ_WRITE_TOKEN to access.
 * The browser cannot load them directly via <img> or fetch() because
 * the token is only available server-side.
 *
 * This endpoint fetches the file server-side and streams it to the client.
 *
 * Usage: GET /api/upload/proxy?url=<blob-url-or-local-path>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'Missing "url" query parameter' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // ── Vercel Blob URL ──
    if (url.includes('.blob.vercel-storage.com')) {
      if (!token) {
        return NextResponse.json(
          { error: 'Cannot access private blob without BLOB_READ_WRITE_TOKEN' },
          { status: 403 },
        );
      }

      // Get metadata first to check content type
      const blobMetadata = await head(url, { token });
      if (!blobMetadata) {
        return NextResponse.json({ error: 'File not found in blob storage' }, { status: 404 });
      }

      // Fetch the actual file content
      const fileResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!fileResponse.ok) {
        return NextResponse.json(
          { error: `Failed to fetch blob file: ${fileResponse.status}` },
          { status: fileResponse.status },
        );
      }

      const contentType = blobMetadata.contentType || fileResponse.headers.get('content-type') || 'application/octet-stream';
      const arrayBuffer = await fileResponse.arrayBuffer();

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(arrayBuffer.byteLength),
          'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
          'X-File-Size': String(blobMetadata.size),
          'X-Uploaded-At': String(blobMetadata.uploadedAt),
        },
      });
    }

    // ── Local file (non-Vercel only) ──
    if (url.startsWith('/uploads/') && !url.includes('..')) {
      const filePath = path.join(process.cwd(), 'public', url);
      const resolved = path.resolve(filePath);
      const allowedRoot = path.resolve(path.join(process.cwd(), 'public', 'uploads'));

      if (!resolved.startsWith(allowedRoot)) {
        return NextResponse.json({ error: 'Path traversal detected' }, { status: 400 });
      }

      try {
        const fileBuffer = await fs.readFile(resolved);

        // Determine content type from extension
        const ext = resolved.split('.').pop()?.toLowerCase() || '';
        const contentTypes: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
          svg: 'image/svg+xml',
          pdf: 'application/pdf',
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': String(fileBuffer.length),
            'Cache-Control': 'private, max-age=300',
          },
        });
      } catch {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    // For any other URL, try to proxy it (e.g., public blob URLs)
    try {
      const fileResponse = await fetch(url);
      if (!fileResponse.ok) {
        return NextResponse.json(
          { error: `Failed to fetch file: ${fileResponse.status}` },
          { status: fileResponse.status },
        );
      }

      const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
      const arrayBuffer = await fileResponse.arrayBuffer();

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(arrayBuffer.byteLength),
          'Cache-Control': 'private, max-age=300',
        },
      });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('[UPLOAD PROXY] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
