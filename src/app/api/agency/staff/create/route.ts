import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';

// POST - Create a new staff account (user + agency link)
export async function POST(req: NextRequest) {
  try {
    const { agencyId, username, fullName, password, staffRole } = await req.json();

    // Validate required fields
    if (!agencyId || !username || !fullName || !password || !staffRole) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate username length
    if (username.trim().length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    // Validate fullName
    if (!fullName.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Validate staffRole
    if (!['STAFF', 'MANAGER', 'AGENCY_STAFF', 'AGENCY_OWNER'].includes(staffRole)) {
      return NextResponse.json({ error: 'Invalid staff role' }, { status: 400 });
    }

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
    return NextResponse.json({
      staff: staffLink,
      initialPassword: password,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/staff/create] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
