/**
 * Upload utility module — abstracts file storage between Vercel Blob and local filesystem.
 *
 * When deployed to Vercel (BLOB_READ_WRITE_TOKEN is set), all uploads go to Vercel Blob.
 * In local development, files are saved to `public/uploads/` and served statically.
 */

import { put, del, head, list } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

// ─── Configuration ───────────────────────────────────────────────────────────

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf',
]);
export const ALLOWED_MIME_PREFIXES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
];
export const VALID_TYPES = new Set(['general', 'receipt', 'logo', 'avatar']);
export const DEFAULT_TYPE = 'general';

// ─── Environment Detection ──────────────────────────────────────────────────

/** True when running on Vercel with Blob storage configured */
export function isVercelBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/** True when running on Vercel platform */
export function isVercelDeployment(): boolean {
  return !!process.env.VERCEL;
}

/** True when Vercel Blob should be used as primary storage */
export function shouldUseVercelBlob(): boolean {
  return isVercelBlobConfigured();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

export function isValidExtension(ext: string): boolean {
  return ALLOWED_EXTENSIONS.has(ext);
}

export function isValidType(type: string): boolean {
  return VALID_TYPES.has(type);
}

export function isBlobUrl(url: string): boolean {
  return url.includes('.blob.vercel-storage.com');
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// ─── Upload Result ───────────────────────────────────────────────────────────

export interface UploadResult {
  /** Public URL of the uploaded file (blob URL or local path) */
  url: string;
  /** Original filename or generated name */
  filename: string;
  /** Storage provider used */
  provider: 'vercel-blob' | 'local';
  /** File size in bytes */
  size: number;
}

// ─── Upload (POST) ──────────────────────────────────────────────────────────

/**
 * Upload a file to Vercel Blob or local filesystem.
 *
 * Automatically detects the environment and chooses the appropriate storage.
 * When `BLOB_READ_WRITE_TOKEN` is set, Vercel Blob is used.
 * Otherwise, files are saved to `public/uploads/<type>/`.
 */
export async function uploadFile(
  file: File,
  type: string = DEFAULT_TYPE,
  options?: { addRandomSuffix?: boolean; metadata?: Record<string, string> },
): Promise<UploadResult> {
  const safeType = VALID_TYPES.has(type) ? type : DEFAULT_TYPE;
  const ext = getExtension(file.name);

  // ── Validate ──
  if (!file) throw new Error('No file provided');
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  if (!isValidExtension(ext)) {
    throw new Error(`Invalid file type .${ext}`);
  }
  if (!isValidMimeType(file.type)) {
    throw new Error(`Invalid MIME type "${file.type}"`);
  }

  const uuid = crypto.randomUUID();
  const filename = `${safeType}/${uuid}.${ext}`;

  // ── Vercel Blob ──
  if (shouldUseVercelBlob()) {
    try {
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: options?.addRandomSuffix ?? false,
        ...(options?.metadata ? { metadata: options.metadata } : {}),
      });
      return {
        url: blob.url,
        filename: blob.pathname.split('/').pop() || filename,
        provider: 'vercel-blob',
        size: file.size,
      };
    } catch (blobError) {
      console.error('[UPLOAD] Vercel Blob failed, falling back to local:', blobError);
      // Fall through to local storage
    }
  }

  // ── Local Filesystem ──
  const localFilename = `${uuid}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeType);
  await ensureDir(uploadDir);
  const filePath = path.join(uploadDir, localFilename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${safeType}/${localFilename}`,
    filename: localFilename,
    provider: 'local',
    size: file.size,
  };
}

// ─── Delete ─────────────────────────────────────────────────────────────────

/**
 * Delete an uploaded file.
 *
 * Automatically detects whether the URL is a Vercel Blob URL or a local path
 * and uses the appropriate deletion method.
 */
export async function deleteFile(url: string): Promise<{ success: boolean; provider: 'vercel-blob' | 'local' }> {
  if (!url || typeof url !== 'string') {
    throw new Error('Provide a valid URL');
  }

  // ── Vercel Blob URL ──
  if (isBlobUrl(url) || url.startsWith('https://')) {
    if (shouldUseVercelBlob()) {
      try {
        await del(url);
        return { success: true, provider: 'vercel-blob' };
      } catch (err) {
        console.error('[UPLOAD DELETE] Vercel Blob delete failed:', err);
        throw new Error('Failed to delete file from Vercel Blob');
      }
    }
    throw new Error('Cannot delete blob URL without BLOB_READ_WRITE_TOKEN');
  }

  // ── Local File ──
  if (!url.startsWith('/uploads/') || url.includes('..')) {
    throw new Error('Invalid local URL');
  }

  const filePath = path.join(process.cwd(), 'public', url);
  const resolved = path.resolve(filePath);
  const allowedRoot = path.resolve(path.join(process.cwd(), 'public', 'uploads'));
  if (!resolved.startsWith(allowedRoot)) {
    throw new Error('Path traversal detected');
  }

  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be deleted
  }

  return { success: true, provider: 'local' };
}

// ─── Head (Metadata) ────────────────────────────────────────────────────────

export interface FileMetadata {
  url: string;
  size?: number;
  uploadedAt?: Date;
  contentType?: string;
  provider: 'vercel-blob' | 'local';
}

/**
 * Get metadata for an uploaded file.
 */
export async function getFileMetadata(url: string): Promise<FileMetadata | null> {
  // ── Vercel Blob URL ──
  if (isBlobUrl(url) && shouldUseVercelBlob()) {
    try {
      const blob = await head(url);
      if (!blob) return null;
      return {
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        contentType: blob.contentType,
        provider: 'vercel-blob',
      };
    } catch {
      return null;
    }
  }

  // ── Local File ──
  if (url.startsWith('/uploads/') && !url.includes('..')) {
    const filePath = path.join(process.cwd(), 'public', url);
    const resolved = path.resolve(filePath);
    const allowedRoot = path.resolve(path.join(process.cwd(), 'public', 'uploads'));
    if (!resolved.startsWith(allowedRoot)) return null;

    try {
      const stat = await fs.stat(resolved);
      return {
        url,
        size: stat.size,
        uploadedAt: stat.birthtime,
        provider: 'local',
      };
    } catch {
      return null;
    }
  }

  return null;
}

// ─── List Files ─────────────────────────────────────────────────────────────

export interface ListResult {
  files: Array<{
    url: string;
    name: string;
    size?: number;
    uploadedAt?: Date;
  }>;
  hasMore: boolean;
  cursor?: string;
  provider: 'vercel-blob' | 'local';
}

/**
 * List uploaded files, optionally filtered by type prefix.
 */
export async function listFiles(options?: {
  prefix?: string;
  limit?: number;
  cursor?: string;
}): Promise<ListResult> {
  const limit = options?.limit ?? 100;
  const prefix = options?.prefix ?? '';

  // ── Vercel Blob ──
  if (shouldUseVercelBlob()) {
    try {
      const result = await list({
        prefix: prefix || undefined,
        limit,
        cursor: options?.cursor || undefined,
      });
      return {
        files: result.blobs.map((b) => ({
          url: b.url,
          name: b.pathname,
          size: b.size,
          uploadedAt: b.uploadedAt,
        })),
        hasMore: result.hasMore,
        cursor: result.cursor,
        provider: 'vercel-blob',
      };
    } catch (err) {
      console.error('[UPLOAD LIST] Vercel Blob list failed, falling back to local:', err);
    }
  }

  // ── Local Filesystem ──
  const uploadRoot = path.join(process.cwd(), 'public', 'uploads');
  const scanDir = prefix ? path.join(uploadRoot, prefix) : uploadRoot;

  try {
    const entries = await fs.readdir(scanDir, { withFileTypes: true });
    const files: ListResult['files'] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(scanDir, entry.name);
      try {
        const stat = await fs.stat(fullPath);
        const relativePath = prefix
          ? `/uploads/${prefix}/${entry.name}`
          : `/uploads/${entry.name}`;
        files.push({
          url: relativePath,
          name: entry.name,
          size: stat.size,
          uploadedAt: stat.birthtime,
        });
      } catch {
        // Skip files we can't stat
      }
    }

    return {
      files: files.slice(0, limit),
      hasMore: false,
      provider: 'local',
    };
  } catch {
    return {
      files: [],
      hasMore: false,
      provider: 'local',
    };
  }
}

// ─── Copy from local to Vercel Blob (for migration) ─────────────────────────

/**
 * Migrate a locally stored file to Vercel Blob.
 * Useful when moving from development to production.
 */
export async function migrateToBlob(localUrl: string): Promise<UploadResult | null> {
  if (!shouldUseVercelBlob()) {
    console.warn('[MIGRATE] BLOB_READ_WRITE_TOKEN not set, skipping migration');
    return null;
  }

  if (!localUrl.startsWith('/uploads/') || localUrl.includes('..')) {
    return null;
  }

  const filePath = path.join(process.cwd(), 'public', localUrl);
  const resolved = path.resolve(filePath);
  const allowedRoot = path.resolve(path.join(process.cwd(), 'public', 'uploads'));
  if (!resolved.startsWith(allowedRoot)) return null;

  try {
    const buffer = await fs.readFile(resolved);
    const filename = localUrl.replace('/uploads/', '');
    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: false,
    });
    return {
      url: blob.url,
      filename: blob.pathname.split('/').pop() || filename,
      provider: 'vercel-blob',
      size: buffer.length,
    };
  } catch (err) {
    console.error('[MIGRATE] Failed to migrate file:', err);
    return null;
  }
}
