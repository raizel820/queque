import { describe, it, expect } from 'vitest';
import { AuthError, handleAuthError } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

describe('AuthError', () => {
  it('should create an AuthError with message and statusCode', () => {
    const error = new AuthError('Test error', 401);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe('AuthError');
    expect(error instanceof Error).toBe(true);
  });

  it('should create AuthError with 403 status', () => {
    const error = new AuthError('Forbidden', 403);
    expect(error.statusCode).toBe(403);
  });
});

describe('handleAuthError', () => {
  it('should return 401 response for AuthError with 401 status', () => {
    const error = new AuthError('Authentication required', 401);
    const response = handleAuthError(error);
    expect(response).not.toBeNull();
    expect(response instanceof NextResponse).toBe(true);
  });

  it('should return 403 response for AuthError with 403 status', () => {
    const error = new AuthError('Admin access required', 403);
    const response = handleAuthError(error);
    expect(response).not.toBeNull();
  });

  it('should return null for non-AuthError errors', () => {
    const error = new Error('Regular error');
    const response = handleAuthError(error);
    expect(response).toBeNull();
  });

  it('should return null for unknown error types', () => {
    const response = handleAuthError('string error');
    expect(response).toBeNull();
  });
});
