import { db } from '@/lib/db';

/**
 * Resolves the agencyId for a given userId by checking:
 * 1. If the user is an agency owner (Agency.ownerId)
 * 2. If the user is agency staff (AgencyStaff.userId)
 *
 * Returns the verified agencyId or null if the user has no agency.
 */
export async function getUserAgencyId(userId: string): Promise<string | null> {
  // Check if user is an agency owner
  const ownedAgency = await db.agency.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (ownedAgency) return ownedAgency.id;

  // Check if user is agency staff
  const staffRecord = await db.agencyStaff.findFirst({
    where: { userId, isActive: true },
    select: { agencyId: true },
  });
  if (staffRecord) return staffRecord.agencyId;

  return null;
}

/**
 * Verifies that the given userId belongs to the specified agencyId.
 * Returns the verified agencyId if ownership checks out, or null otherwise.
 *
 * This is the primary function to use in API routes for tenant isolation.
 * It resolves the user's agency and optionally checks it against a requested agencyId.
 */
export async function verifyAgencyOwnership(
  userId: string,
  requestedAgencyId?: string | null
): Promise<{ agencyId: string; isOwner: boolean } | null> {
  // Check if user is an agency owner
  const ownedAgency = await db.agency.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (ownedAgency) {
    // If a specific agencyId was requested, verify it matches
    if (requestedAgencyId && requestedAgencyId !== ownedAgency.id) {
      return null; // Owner tried to access a different agency
    }
    return { agencyId: ownedAgency.id, isOwner: true };
  }

  // Check if user is agency staff
  const staffRecord = await db.agencyStaff.findFirst({
    where: { userId, isActive: true },
    select: { agencyId: true },
  });

  if (staffRecord) {
    // If a specific agencyId was requested, verify it matches
    if (requestedAgencyId && requestedAgencyId !== staffRecord.agencyId) {
      return null; // Staff tried to access a different agency
    }
    return { agencyId: staffRecord.agencyId, isOwner: false };
  }

  return null; // User has no agency
}
