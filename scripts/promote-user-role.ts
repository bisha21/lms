// Idempotent CLI for assigning a role to an existing user. There's no self-service signup
// path for super_admin/instructor (by design — role is set directly in the DB), so this is
// the practical equivalent of a "migration" for the new roles introduced in this phase.
//
// Usage: npm run role:promote -- <email> <super_admin|admin|instructor|student>
import 'dotenv/config';
import { createConnection } from '../src/database/db';
import User from '../src/database/models/user.schema';
import { ROLE_VALUES, Role } from '../src/lib/rbac/roles';

async function main() {
  const [email, role] = process.argv.slice(2);

  if (!email || !role) {
    console.error('Usage: npm run role:promote -- <email> <super_admin|admin|instructor|student>');
    process.exit(1);
  }
  if (!ROLE_VALUES.includes(role as Role)) {
    console.error(`Invalid role "${role}". Must be one of: ${ROLE_VALUES.join(', ')}`);
    process.exit(1);
  }

  await createConnection();
  const user = await User.findOneAndUpdate({ email }, { role }, { new: true });

  if (!user) {
    console.error(`No user found with email "${email}"`);
    process.exit(1);
  }

  console.log(`Updated ${user.email} -> role: ${user.role}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
