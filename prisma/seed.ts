import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedCourses() {
  const coursesDir = path.join(__dirname, 'seed-data/courses');
  if (!fs.existsSync(coursesDir)) return;

  const files = fs.readdirSync(coursesDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const courseData = JSON.parse(
      fs.readFileSync(path.join(coursesDir, file), 'utf-8'),
    );

    await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: courseData,
      create: courseData,
    });
    console.log(`✅ Seeded course: ${courseData.title}`);
  }
}

async function main() {
  await seedCourses();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
