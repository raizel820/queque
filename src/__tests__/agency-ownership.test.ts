import { describe, it, expect } from 'vitest';
import { getUserAgencyId, verifyAgencyOwnership } from '@/lib/auth-agency';
import { db } from '@/lib/db';

describe('Agency Ownership Verification', () => {
  // These tests use the seeded database
  // Seed data: clinic01 (AGENCY_OWNER) owns an agency

  it('should return agencyId for an agency owner', async () => {
    // Find an agency owner from seed data
    const owner = await db.user.findFirst({
      where: { role: 'AGENCY_OWNER' },
    });
    
    if (owner) {
      const agencyId = await getUserAgencyId(owner.id);
      expect(agencyId).not.toBeNull();
    }
  });

  it('should return null for a customer', async () => {
    const customer = await db.user.findFirst({
      where: { role: 'CUSTOMER' },
    });
    
    if (customer) {
      const agencyId = await getUserAgencyId(customer.id);
      expect(agencyId).toBeNull();
    }
  });

  it('should verify agency ownership for the correct owner', async () => {
    const owner = await db.user.findFirst({
      where: { role: 'AGENCY_OWNER' },
      include: { ownedAgencies: { take: 1 } },
    });
    
    if (owner && owner.ownedAgencies.length > 0) {
      const result = await verifyAgencyOwnership(owner.id, owner.ownedAgencies[0].id);
      expect(result).not.toBeNull();
      expect(result?.isOwner).toBe(true);
      expect(result?.agencyId).toBe(owner.ownedAgencies[0].id);
    }
  });

  it('should reject ownership for wrong agency', async () => {
    const owner = await db.user.findFirst({
      where: { role: 'AGENCY_OWNER' },
      include: { ownedAgencies: { take: 1 } },
    });

    // Try with a made-up agencyId
    if (owner) {
      const result = await verifyAgencyOwnership(owner.id, 'non-existent-agency-id');
      expect(result).toBeNull();
    }
  });

  it('should reject ownership for customer role', async () => {
    const customer = await db.user.findFirst({
      where: { role: 'CUSTOMER' },
    });

    const agency = await db.agency.findFirst();

    if (customer && agency) {
      const result = await verifyAgencyOwnership(customer.id, agency.id);
      expect(result).toBeNull();
    }
  });
});
