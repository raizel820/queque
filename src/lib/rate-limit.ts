/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach with cleanup.
 */

import { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 60 seconds
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key)
    }
  }
}, 60_000)

export interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum number of requests in the window */
  maxRequests: number
  /** Key prefix for namespacing */
  prefix?: string
}

export class RateLimitError extends Error {
  public retryAfter: number

  constructor(retryAfter: number) {
    super('Too many requests, please try again later')
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

/**
 * Checks rate limit for a given identifier (e.g., IP address or user ID).
 * Throws RateLimitError if limit exceeded.
 * Returns the current count if within limit.
 */
export function checkRateLimit(identifier: string, options: RateLimitOptions): number {
  const key = `${options.prefix || 'rl'}:${identifier}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    // New window
    store.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    })
    return 1
  }

  // Existing window
  entry.count++

  if (entry.count > options.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    throw new RateLimitError(retryAfter)
  }

  return entry.count
}

/**
 * Gets the client IP from a NextRequest.
 * Handles X-Forwarded-For and other proxy headers.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return 'unknown'
}

// ─── Preset configurations ──────────────────────────────────────────────────

/** Auth endpoints: 5 requests per 15 minutes per IP */
export const AUTH_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  prefix: 'auth',
}

/** Login: 10 attempts per 15 minutes per IP */
export const LOGIN_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  prefix: 'login',
}

/** Queue operations: 30 requests per minute per user */
export const QUEUE_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000,
  maxRequests: 30,
  prefix: 'queue',
}

/** General API: 60 requests per minute per IP */
export const GENERAL_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000,
  maxRequests: 60,
  prefix: 'api',
}

/** Password reset: 3 per hour per IP */
export const PASSWORD_RESET_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  prefix: 'pwreset',
}

/** SMS sending: 10 per hour per user */
export const SMS_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  prefix: 'sms',
}
