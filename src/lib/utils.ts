import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert a Vercel Blob URL or any URL to a proxied URL for private blob stores.
 * If the URL is a blob.vercel-storage.com URL, it needs to go through the proxy.
 * Local paths (/uploads/...) are returned as-is since they're served statically.
 * Non-blob external URLs are returned as-is.
 */
export function getProxiedUrl(url: string | null | undefined): string {
  if (!url) return '';
  // Blob URLs need to be proxied since the store is private
  if (url.includes('.blob.vercel-storage.com')) {
    return `/api/upload/proxy?url=${encodeURIComponent(url)}`;
  }
  // Local paths are served statically, no proxy needed
  return url;
}
