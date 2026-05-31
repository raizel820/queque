import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/password';

describe('Password hashing and verification', () => {
  it('should hash a password and verify it correctly', () => {
    const password = 'testPassword123';
    const hash = hashPassword(password);
    
    // Hash should be in salt:hash format
    expect(hash).toContain(':');
    expect(hash.split(':')).toHaveLength(2);
    
    // Should verify the correct password
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it('should reject wrong password', () => {
    const password = 'testPassword123';
    const hash = hashPassword(password);
    
    expect(verifyPassword('wrongPassword', hash)).toBe(false);
  });

  it('should generate different hashes for same password (different salt)', () => {
    const password = 'testPassword123';
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);
    
    // Different salts should produce different hashes
    expect(hash1).not.toBe(hash2);
    
    // But both should verify the same password
    expect(verifyPassword(password, hash1)).toBe(true);
    expect(verifyPassword(password, hash2)).toBe(true);
  });

  it('should return false for malformed hash', () => {
    expect(verifyPassword('test', 'no-colon')).toBe(false);
    expect(verifyPassword('test', '')).toBe(false);
  });
});
