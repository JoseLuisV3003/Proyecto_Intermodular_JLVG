import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (!globalForPrisma.prisma) {
  // Only create PrismaClient in server context
  if (typeof window === 'undefined') {
    globalForPrisma.prisma = new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma as PrismaClient;
