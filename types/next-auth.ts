import { DefaultSession } from 'next-auth';
import { Role } from '@/lib/rbac/roles';

declare module 'next-auth' {
  interface Session {
    user: {
      role: Role;
      id: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}
