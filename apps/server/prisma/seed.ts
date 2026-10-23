import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMeStronglyBeforeUse123!';

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    console.log(`Seed admin already exists: ${adminEmail}`);
    return;
  }

  const passwordHash = await argon2.hash(adminPassword);

  await prisma.adminUser.create({
    data: {
      email: adminEmail,
      passwordHash,
      name: 'Mike',
    },
  });

  console.log(`Seed admin created for ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
