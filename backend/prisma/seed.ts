import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.create({
    data: { name: 'Mi Empresa S.L.' },
  });

  await prisma.companySettings.create({
    data: { companyId: company.id },
  });

  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'admin@miempresa.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.employee.create({
    data: {
      companyId: company.id,
      userId: adminUser.id,
      firstName: 'Administrador',
      lastName: 'Principal',
      email: 'admin@miempresa.com',
      position: 'Gerente',
      hireDate: new Date(),
    },
  });

  console.log('Seed completado. Login: admin@miempresa.com / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
