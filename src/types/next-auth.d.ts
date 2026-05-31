import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    fullName: string;
    role: string;
    language: string;
    agencyId: string;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    fullName: string;
    role: string;
    language: string;
    agencyId: string;
  }
}
