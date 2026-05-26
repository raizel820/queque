import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        expectedRole: { label: 'Expected Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Find user by username
        const user = await db.user.findUnique({
          where: { username: credentials.username },
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            language: true,
            avatarUrl: true,
            freeSmsCount: true,
            isActive: true,
            passwordHash: true,
          },
        });

        if (!user || !user.isActive) {
          return null;
        }

        // Verify password
        const isPasswordValid = verifyPassword(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        // Check if user's role matches the expected role from login tab
        const expectedRole = credentials.expectedRole;
        const agencyRoles = ['AGENCY_OWNER', 'AGENCY_STAFF'];

        if (expectedRole) {
          const isAgencyTab = agencyRoles.includes(expectedRole);
          const isCustomerTab = expectedRole === 'CUSTOMER';

          if (user.role === 'SUPER_ADMIN') {
            // SUPER_ADMIN can login from any tab
          } else if (isAgencyTab && agencyRoles.includes(user.role)) {
            // allowed
          } else if (isCustomerTab && user.role === 'CUSTOMER') {
            // allowed
          } else {
            // Role mismatch
            return null;
          }
        }

        // Look up agencyId for agency owners, staff, and super admin
        let agencyId: string | undefined;
        if (user.role === 'SUPER_ADMIN') {
          const firstAgency = await db.agency.findFirst({
            select: { id: true },
          });
          agencyId = firstAgency?.id;
        } else if (user.role === 'AGENCY_OWNER') {
          const ownedAgency = await db.agency.findFirst({
            where: { ownerId: user.id },
            select: { id: true },
          });
          agencyId = ownedAgency?.id;
        } else if (user.role === 'AGENCY_STAFF') {
          const staffAssignment = await db.agencyStaff.findFirst({
            where: { userId: user.id, isActive: true },
            select: { agencyId: true },
          });
          agencyId = staffAssignment?.agencyId;
        }

        // Return user object that will be stored in the JWT
        return {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          language: user.language,
          agencyId: agencyId || '',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add custom fields to token
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.fullName = user.fullName;
        token.role = user.role;
        token.language = user.language;
        token.agencyId = user.agencyId;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose custom fields in the session
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.fullName = token.fullName;
        session.user.role = token.role;
        session.user.language = token.language;
        session.user.agencyId = token.agencyId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
