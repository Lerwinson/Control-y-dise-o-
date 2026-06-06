import { PrismaClient } from '@prisma/client';

// Single Prisma instance reused across the server process
export const prisma = new PrismaClient();
