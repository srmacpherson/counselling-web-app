import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

const envPath = fileURLToPath(new URL('../../../.env', import.meta.url));
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMeStronglyBeforeUse123!';

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    const passwordHash = await argon2.hash(adminPassword);

    await prisma.adminUser.update({
      where: { id: existingAdmin.id },
      data: {
        passwordHash,
        name: 'Mike',
      },
    });

    console.log(`Seed admin refreshed for ${adminEmail}`);
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
