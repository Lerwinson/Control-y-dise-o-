import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'lerwinson@fsdpro.com' },
    update: {},
    create: { email: 'lerwinson@fsdpro.com', name: 'Lerwinson Mendoza', password, role: 'admin' },
  });

  const bed = await prisma.project.create({
    data: {
      name: 'Cama Queen — Cliente A', type: 'bed', stage: 1, currency: 'USD', margin: 35, ownerId: admin.id,
      parts: {
        create: [
          { code: 'BF-01', name: 'Cabecero', category: 'panel', material: 'mdf', length: 1450, width: 600, thickness: 30, qty: 1, color: '#b9743a' },
          { code: 'BF-03', name: 'Larguero', category: 'frame', material: 'pine', length: 1950, width: 200, thickness: 30, qty: 2, color: '#c98a4b' },
          { code: 'BF-08', name: 'Pata', category: 'leg', material: 'oak', length: 120, width: 70, thickness: 70, qty: 4, color: '#8a5a2b' },
        ],
      },
    },
  });

  console.log('Seeded:', { admin: admin.email, project: bed.name });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
