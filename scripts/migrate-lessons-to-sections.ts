// One-off, manual migration for pre-Section lessons. Not run automatically — run once
// against your real database after deploying the Section model:
//   npm run migrate:lessons-to-sections
import 'dotenv/config';
import { createConnection } from '../src/database/db';
import { migrateLessonsToSections } from '../src/lib/migrations/lessonsToSections';

async function main() {
  await createConnection();
  const { coursesMigrated, lessonsMigrated } = await migrateLessonsToSections();
  console.log(`Migrated ${lessonsMigrated} lesson(s) across ${coursesMigrated} course(s).`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
