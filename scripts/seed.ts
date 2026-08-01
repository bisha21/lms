// Populates a (typically empty, local/dev) database with realistic demo data — categories,
// instructors, students, published courses with sections/lessons, reviews, enrollments,
// payments, progress, wishlists, cart items, and a couple of coupons — so the catalog,
// landing page, and dashboards have something real to render.
//
// Idempotent: every write is keyed on a unique field (title, email, student+course, ...)
// and upserted, so re-running never throws duplicate-key errors. Re-running does re-roll
// which students get enrolled/reviewed/etc. on each course, which only ever adds more
// sample rows — it never deletes anything, so it's always safe to run again.
//
// Usage: npm run seed
import 'dotenv/config';
import { createConnection } from '../src/database/db';
import Category from '../src/database/models/category';
import Course, { CourseLevel, CourseStatus } from '../src/database/models/course.schema';
import { Section } from '../src/database/models/section';
import { Lesson, LessonContentType } from '../src/database/models/lesson';
import User from '../src/database/models/user.schema';
import { Role } from '../src/lib/rbac/roles';
import { Enrollment } from '../src/database/models/enrollment.model';
import { Review } from '../src/database/models/review';
import { Payment, PaymentStatus } from '../src/database/models/payment.model';
import { Progress } from '../src/database/models/progress.model';
import { Wishlist } from '../src/database/models/wishlist';
import { Cart } from '../src/database/models/cart';
import { Coupon, CouponDiscountType } from '../src/database/models/coupon';

const SEED_PASSWORD = 'Password123!';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CATEGORY_DEFS = [
  { name: 'Web Development', description: 'Build websites and web applications from front to back end.' },
  { name: 'Data Science', description: 'Analyze data, build models, and drive decisions with numbers.' },
  { name: 'Design', description: 'UI/UX, graphic design, and visual storytelling.' },
  { name: 'Marketing', description: 'Grow audiences and revenue through digital channels.' },
  { name: 'Business', description: 'Strategy, management, and entrepreneurship skills.' },
  { name: 'Mobile Development', description: 'Build native and cross-platform mobile apps.' },
  { name: 'Cybersecurity', description: 'Protect systems, networks, and data from attackers.' },
  { name: 'Photography', description: 'Master your camera, lighting, and post-processing.' },
];

const INSTRUCTOR_DEFS = [
  { username: 'Sarah Chen', email: 'sarah.chen@seed.dev' },
  { username: 'Marcus Webb', email: 'marcus.webb@seed.dev' },
  { username: 'Priya Nair', email: 'priya.nair@seed.dev' },
  { username: 'Daniel Osei', email: 'daniel.osei@seed.dev' },
];

const STUDENT_DEFS = [
  { username: 'Alex Kim', email: 'alex.kim@seed.dev' },
  { username: 'Jordan Lee', email: 'jordan.lee@seed.dev' },
  { username: 'Taylor Morgan', email: 'taylor.morgan@seed.dev' },
  { username: 'Sam Rivera', email: 'sam.rivera@seed.dev' },
  { username: 'Casey Jones', email: 'casey.jones@seed.dev' },
  { username: 'Morgan Diaz', email: 'morgan.diaz@seed.dev' },
];

const LEVELS = [CourseLevel.BEGINNER, CourseLevel.INTERMEDIATE, CourseLevel.ADVANCED];
const LANGUAGES = ['English', 'English', 'English', 'Spanish', 'French'];
const SAMPLE_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

interface CourseDef {
  title: string;
  category: string;
  description: string;
  price: number;
}

const COURSE_DEFS: CourseDef[] = [
  // Web Development
  {
    title: 'The Complete Full-Stack Web Development Bootcamp',
    category: 'Web Development',
    description:
      'Go from zero to job-ready: HTML, CSS, JavaScript, React, Node.js, Express, and MongoDB in one practical, project-driven course.',
    price: 89.99,
  },
  {
    title: 'Modern React with TypeScript',
    category: 'Web Development',
    description:
      'Build fast, type-safe React applications using hooks, context, and the patterns used in real production codebases.',
    price: 64.99,
  },
  {
    title: 'Node.js & Express API Masterclass',
    category: 'Web Development',
    description:
      'Design, build, and deploy secure REST APIs with Node.js, Express, and MongoDB — authentication, validation, and testing included.',
    price: 54.99,
  },
  // Data Science
  {
    title: 'Python for Data Science and Machine Learning',
    category: 'Data Science',
    description:
      'Learn NumPy, Pandas, Matplotlib, and scikit-learn by working through real datasets and end-to-end ML projects.',
    price: 94.99,
  },
  {
    title: 'Data Visualization with D3.js and Tableau',
    category: 'Data Science',
    description:
      'Turn raw data into compelling, interactive visual stories using D3.js for the web and Tableau for business dashboards.',
    price: 49.99,
  },
  {
    title: 'SQL for Data Analysis: Zero to Advanced',
    category: 'Data Science',
    description:
      'Master querying, joins, window functions, and query optimization across real-world analytical datasets.',
    price: 39.99,
  },
  // Design
  {
    title: 'UI/UX Design Fundamentals with Figma',
    category: 'Design',
    description:
      'Learn user research, wireframing, prototyping, and design systems while building a full case-study portfolio in Figma.',
    price: 59.99,
  },
  {
    title: 'Graphic Design Masterclass: Logo to Brand Identity',
    category: 'Design',
    description:
      'Go from a blank canvas to a complete brand identity — logos, color systems, typography, and brand guidelines.',
    price: 44.99,
  },
  {
    title: 'Motion Design and After Effects Essentials',
    category: 'Design',
    description:
      'Animate UI, illustrations, and typography with After Effects — from keyframes to polished motion graphics reels.',
    price: 69.99,
  },
  // Marketing
  {
    title: 'The Complete Digital Marketing Course',
    category: 'Marketing',
    description:
      'SEO, social media, email, and paid ads — a full-funnel digital marketing playbook for growing any business.',
    price: 79.99,
  },
  {
    title: 'SEO 2026: Complete Search Engine Optimization',
    category: 'Marketing',
    description:
      'Rank higher on Google with modern technical SEO, content strategy, and link-building techniques that actually work.',
    price: 49.99,
  },
  {
    title: 'Social Media Marketing & Content Strategy',
    category: 'Marketing',
    description:
      'Plan, create, and measure content across Instagram, TikTok, and LinkedIn to grow an engaged audience.',
    price: 0,
  },
  // Business
  {
    title: 'Business Analytics and Strategic Decision Making',
    category: 'Business',
    description:
      'Use data-driven frameworks to make better business decisions, from forecasting to competitive analysis.',
    price: 54.99,
  },
  {
    title: 'Entrepreneurship 101: Launch Your Startup',
    category: 'Business',
    description:
      'A practical roadmap for validating an idea, building an MVP, and raising your first round of funding.',
    price: 0,
  },
  {
    title: 'Project Management Professional (PMP) Prep',
    category: 'Business',
    description:
      'Structured exam prep covering the PMBOK framework, agile practices, and real practice exams.',
    price: 99.99,
  },
  // Mobile Development
  {
    title: 'iOS App Development with Swift',
    category: 'Mobile Development',
    description:
      'Build and ship real iOS apps with Swift and SwiftUI, from your first view to the App Store.',
    price: 74.99,
  },
  {
    title: 'Android Development with Kotlin',
    category: 'Mobile Development',
    description:
      'Learn modern Android development with Kotlin, Jetpack Compose, and architecture best practices.',
    price: 74.99,
  },
  {
    title: 'React Native: Build Cross-Platform Apps',
    category: 'Mobile Development',
    description:
      'Ship one codebase to iOS and Android with React Native, Expo, and native module integration.',
    price: 64.99,
  },
  // Cybersecurity
  {
    title: 'Ethical Hacking and Penetration Testing',
    category: 'Cybersecurity',
    description:
      'Hands-on penetration testing in a legal lab environment — reconnaissance, exploitation, and reporting.',
    price: 84.99,
  },
  {
    title: 'Cybersecurity Fundamentals: Protect Your Network',
    category: 'Cybersecurity',
    description:
      'Core concepts every defender needs: network security, threat modeling, and incident response basics.',
    price: 39.99,
  },
  {
    title: 'Certified Information Security Fundamentals',
    category: 'Cybersecurity',
    description:
      'Exam-focused prep covering security governance, risk management, and cryptography fundamentals.',
    price: 59.99,
  },
  // Photography
  {
    title: 'Digital Photography Masterclass',
    category: 'Photography',
    description:
      'Understand your camera inside and out — exposure, composition, and lighting for stunning photos.',
    price: 34.99,
  },
  {
    title: 'Adobe Lightroom & Photoshop for Photographers',
    category: 'Photography',
    description:
      'Edit like a pro with a complete Lightroom and Photoshop workflow, from raw import to final export.',
    price: 44.99,
  },
  {
    title: 'Portrait Photography: Lighting and Composition',
    category: 'Photography',
    description:
      'Master natural and studio lighting setups to shoot confident, professional portraits.',
    price: 0,
  },
];

const SECTION_TITLES = ['Getting Started', 'Core Concepts', 'Hands-On Practice', 'Advanced Topics', 'Final Project'];

async function upsertUser(def: { username: string; email: string }, role: Role) {
  const existing = await User.findOne({ email: def.email });
  if (existing) return existing;
  return User.create({ ...def, role, password: SEED_PASSWORD });
}

async function seed() {
  await createConnection();

  console.log('Seeding categories...');
  const categories = new Map<string, InstanceType<typeof Category>>();
  for (const def of CATEGORY_DEFS) {
    // findOneAndUpdate-with-upsert skips the pre('save') hook that generates `slug`, which
    // would insert every new doc with slug: null and collide on the unique index — so a
    // plain find-then-create is used here instead, same as for Course below.
    let category = await Category.findOne({ name: def.name });
    if (!category) category = await Category.create({ name: def.name, description: def.description });
    categories.set(def.name, category);
  }

  console.log('Seeding instructors and students...');
  const instructors = [];
  for (const def of INSTRUCTOR_DEFS) instructors.push(await upsertUser(def, Role.INSTRUCTOR));
  const students = [];
  for (const def of STUDENT_DEFS) students.push(await upsertUser(def, Role.STUDENT));

  console.log('Seeding courses, sections, and lessons...');
  const courses = [];
  for (const def of COURSE_DEFS) {
    const category = categories.get(def.category)!;
    const instructor = pick(instructors);
    const slug = def.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let course = await Course.findOne({ title: def.title });
    if (!course) {
      course = await Course.create({
        title: def.title,
        courseDescription: def.description,
        coursePrice: def.price,
        duration: `${randomInt(4, 40)}h ${randomInt(0, 5) * 10}m`,
        category: category._id,
        instructor: instructor._id,
        status: CourseStatus.PUBLISHED,
        level: pick(LEVELS),
        language: pick(LANGUAGES),
        thumbnail: `https://picsum.photos/seed/${slug}/640/360`,
      });
    }
    courses.push(course);

    const existingSections = await Section.find({ course: course._id });
    if (existingSections.length > 0) continue; // sections/lessons already seeded for this course

    const sectionCount = randomInt(3, 5);
    let globalLessonOrder = 0;
    for (let s = 0; s < sectionCount; s++) {
      const section = await Section.create({
        course: course._id,
        title: SECTION_TITLES[s] ?? `Module ${s + 1}`,
        order: s,
      });

      const lessonCount = randomInt(3, 5);
      for (let l = 0; l < lessonCount; l++) {
        await Lesson.create({
          course: course._id,
          section: section._id,
          title: `${section.title}: Lesson ${l + 1}`,
          description: `Part of "${section.title}" in ${def.title}.`,
          contentType: LessonContentType.VIDEO,
          videoUrl: SAMPLE_VIDEO_URL,
          order: l,
          durationSeconds: randomInt(180, 900),
        });
        globalLessonOrder++;
      }
    }
    void globalLessonOrder;
  }

  console.log('Seeding reviews, enrollments, payments, and progress...');
  for (const course of courses) {
    const reviewers = pickN(students, randomInt(2, students.length));
    for (const student of reviewers) {
      await Review.findOneAndUpdate(
        { student: student._id, course: course._id },
        { $setOnInsert: { rating: randomInt(3, 5) } },
        { upsert: true }
      );
    }

    const enrolledStudents = pickN(students, randomInt(2, 4));
    const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });

    for (const student of enrolledStudents) {
      await Enrollment.findOneAndUpdate(
        { student: student._id, course: course._id },
        { $setOnInsert: { enrolledAt: new Date() } },
        { upsert: true }
      );

      await Payment.findOneAndUpdate(
        { student: student._id, course: course._id },
        {
          $setOnInsert: {
            amount: course.coursePrice,
            currency: 'usd',
            status: PaymentStatus.Completed,
            transactionId: `seed_${student._id}_${course._id}`,
          },
        },
        { upsert: true }
      );

      if (lessons.length > 0) {
        // Roughly a third fully complete the course, a third are partway through, a third
        // haven't started — gives "Continue Learning" and dashboard stats a real mix.
        const completionRoll = Math.random();
        const completedCount =
          completionRoll < 0.33 ? lessons.length : completionRoll < 0.66 ? randomInt(1, lessons.length - 1) : 0;
        const completedLessons = lessons.slice(0, completedCount).map((l) => l._id);
        const lastViewedLesson = completedLessons.length > 0 ? completedLessons[completedLessons.length - 1] : lessons[0]._id;

        await Progress.findOneAndUpdate(
          { student: student._id, course: course._id },
          { $set: { completedLessons, lastViewedLesson } },
          { upsert: true }
        );
      }
    }
  }

  console.log('Seeding wishlists and a cart...');
  for (const student of students) {
    const wishlistCourses = pickN(courses, randomInt(2, 4)).map((c) => c._id);
    await Wishlist.findOneAndUpdate(
      { student: student._id },
      { $setOnInsert: { items: wishlistCourses } },
      { upsert: true }
    );
  }
  const cartStudent = students[0];
  const cartCourses = pickN(
    courses.filter((c) => c.coursePrice > 0),
    2
  ).map((c) => c._id);
  await Cart.findOneAndUpdate(
    { student: cartStudent._id },
    { $setOnInsert: { items: cartCourses } },
    { upsert: true }
  );

  console.log('Seeding coupons...');
  await Coupon.findOneAndUpdate(
    { code: 'WELCOME10' },
    {
      $setOnInsert: {
        discountType: CouponDiscountType.PERCENTAGE,
        value: 10,
        isActive: true,
      },
    },
    { upsert: true }
  );
  await Coupon.findOneAndUpdate(
    { code: 'SAVE20' },
    {
      $setOnInsert: {
        discountType: CouponDiscountType.FIXED,
        value: 20,
        isActive: true,
      },
    },
    { upsert: true }
  );

  console.log(
    `Done. ${categories.size} categories, ${instructors.length} instructors, ${students.length} students, ${courses.length} courses.`
  );
  console.log(`Seed accounts use the password: ${SEED_PASSWORD}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
