import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';
import { validateBody, createStaffSchema } from '@/lib/validations';
import { z } from 'zod';
import { emitStaffEvent } from '@/lib/realtime-emit';

const createStaffBodySchema = createStaffSchema.extend({
  agencyId: z.string().min(1, 'Agency ID is required'),
  staffRole: z.enum(['STAFF', 'MANAGER', 'AGENCY_STAFF', 'AGENCY_OWNER']).optional().default('STAFF'),
});

// POST - Create a new staff account (user + agency link)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateBody(createStaffBodySchema, body);
    if (validation.error) return validation.error;

    const { agencyId, username, fullName, password, phoneNumber, staffRole } = validation.data;

    await requireAgencyAccess(req, agencyId);

    // Map AGENCY_STAFF -> AGENCY_STAFF user role, AGENCY_OWNER -> AGENCY_OWNER user role
    const userRole = staffRole === 'AGENCY_OWNER' ? 'AGENCY_OWNER' : 'AGENCY_STAFF';
    // Map to AgencyStaff role
    const agencyStaffRole = staffRole === 'AGENCY_OWNER' ? 'OWNER' : staffRole === 'MANAGER' ? 'MANAGER' : 'STAFF';

    // Verify agency exists
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Check username uniqueness
    const existingUser = await db.user.findUnique({
      where: { username: username.trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'This username is already taken' }, { status: 409 });
    }

    // Hash the password
    const passwordHash = hashPassword(password);

    // Create User with appropriate role
    const user = await db.user.create({
      data: {
        username: username.trim(),
        fullName: fullName.trim(),
        passwordHash,
        phoneNumber,
        role: userRole,
        language: 'ar',
        isActive: true,
      },
    });

    // Create AgencyStaff link
    const staffLink = await db.agencyStaff.create({
      data: {
        userId: user.id,
        agencyId,
        role: agencyStaffRole,
      },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, role: true, isActive: true },
        },
      },
    });

    // Return the created staff with initial password so owner can share it
    // Emit realtime event (fire-and-forget)
    emitStaffEvent('staff:updated', agencyId, {
      action: 'staff-created',
      staffId: staffLink.id,
      userId: user.id,
      username: user.username,
    })

    return NextResponse.json({
      staff: staffLink,
      initialPassword: password,
    }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error)
  }
}
