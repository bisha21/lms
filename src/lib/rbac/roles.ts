// Zero dependencies by design — imported by edge middleware (src/middleware.ts), the
// Mongoose user schema, and every server-side guard, so it must never pull in
// mongoose/bcrypt or anything else that can't run in the Edge runtime.
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

export const ROLE_VALUES = Object.values(Role);
