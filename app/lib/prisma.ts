import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as any;

if (!globalForPrisma.prisma) {
  // Only create PrismaClient in server context
  if (typeof window === 'undefined') {
    globalForPrisma.prisma = new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma as InstanceType<typeof PrismaClient>;
