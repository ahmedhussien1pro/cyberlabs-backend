import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();
// async function seedCourses() {
//   const coursesDir = path.join(__dirname, 'seed-data/courses');
//   if (!fs.existsSync(coursesDir)) return;
//   const files = fs.readdirSync(coursesDir).filter((f) => f.endsWith('.json'));
//   for (const file of files) {
//     const courseData = JSON.parse(
//       fs.readFileSync(path.join(coursesDir, file), 'utf-8'),
//     );
//     await prisma.course.upsert({
//       where: { slug: courseData.slug },
//       update: courseData,
//       create: courseData,
//     });
//     console.log(`✅ Seeded course: ${courseData.title}`);
//   }
// }
async function seedLabs() {
  const labsDir = path.join(__dirname, 'seed-data/labs');
  if (!fs.existsSync(labsDir)) return;
  const files = fs.readdirSync(labsDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const labData = JSON.parse(
      fs.readFileSync(path.join(labsDir, file), 'utf-8'),
    );
    // Handle relationships if needed (like lab hints)
    const { hints, ...labFields } = labData;
    const createdLab = await prisma.lab.create({
      data: {
        ...labFields,
        hints: hints
          ? {
              create: hints,
            }
          : undefined,
      },
    });
    console.log(`✅ Seeded lab: ${createdLab.title}`);
  }
}
async function main() {
  //   await seedCourses();
  await seedLabs();
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
