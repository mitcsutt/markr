import { prisma } from '../src/client';

async function main() {
  console.log(`Start seeding ...`);

  // Clear existing data
  await prisma.student.deleteMany();
  await prisma.test.deleteMany();
  await prisma.submission.deleteMany();

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
